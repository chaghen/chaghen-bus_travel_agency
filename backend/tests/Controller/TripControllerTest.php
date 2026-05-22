<?php

namespace App\Tests\Controller;

use App\Entity\Agency;
use App\Entity\Trip;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class TripControllerTest extends WebTestCase
{
    private $client;
    private EntityManagerInterface $em;
    private Agency $agency;

    protected function setUp(): void
    {
        $this->client = static::createClient();
        $this->em     = static::getContainer()->get(EntityManagerInterface::class);
        $this->purge();
        $this->agency = $this->seed();
    }

    private function purge(): void
    {
        $this->em->createQuery('DELETE FROM App\Entity\Booking b')->execute();
        $this->em->createQuery('DELETE FROM App\Entity\Trip t')->execute();
        $this->em->createQuery('DELETE FROM App\Entity\Agency a')->execute();
    }

    private function seed(): Agency
    {
        $hasher = static::getContainer()->get(UserPasswordHasherInterface::class);
        $a = new Agency();
        $a->setName('Test Agency')->setEmail('agency@test.fr')->setCity('Paris')
          ->setStatus(Agency::STATUS_ACTIVE)->setRoles(['ROLE_AGENCY_ADMIN'])
          ->setPassword($hasher->hashPassword($a, 'password123'));
        $this->em->persist($a);
        $this->em->flush();
        return $a;
    }

    private function getJwt(): string
    {
        $this->client->request('POST', '/api/auth/login', [], [], ['CONTENT_TYPE' => 'application/json'],
            json_encode(['email' => 'agency@test.fr', 'password' => 'password123']));
        return json_decode($this->client->getResponse()->getContent(), true)['token'] ?? '';
    }

    private function createTrip(string $token): int
    {
        $this->client->request('POST', '/api/trips', [], [], [
            'CONTENT_TYPE' => 'application/json', 'HTTP_AUTHORIZATION' => "Bearer $token",
        ], json_encode([
            'fromCity' => 'Paris', 'toCity' => 'Lyon',
            'date' => date('Y-m-d'), 'departureTime' => '09:00', 'arrivalTime' => '13:00',
            'duration' => '4h00', 'price' => 35.0, 'type' => 'standard',
            'totalSeats' => 50, 'availableSeats' => 50,
            'baggageAllowance' => 20, 'extraBaggagePrice' => 6.0,
        ]));
        return json_decode($this->client->getResponse()->getContent(), true)['id'];
    }

    public function testSearchTripsPublic(): void
    {
        $this->client->request('GET', '/api/trips');
        $this->assertResponseIsSuccessful();
        $this->assertJson($this->client->getResponse()->getContent());
    }

    public function testSearchWithFilters(): void
    {
        $token = $this->getJwt();
        $this->createTrip($token);

        $this->client->request('GET', '/api/trips?fromCity=Paris&toCity=Lyon');
        $this->assertResponseIsSuccessful();
        $trips = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertIsArray($trips);
        $this->assertCount(1, $trips);
        $this->assertEquals('Paris', $trips[0]['fromCity']);
    }

    public function testCreateTripRequiresAuth(): void
    {
        $this->client->request('POST', '/api/trips', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'fromCity' => 'Paris', 'toCity' => 'Lyon', 'price' => 35,
        ]));
        $this->assertResponseStatusCodeSame(401);
    }

    public function testCreateAndUpdateTrip(): void
    {
        $token = $this->getJwt();
        $id    = $this->createTrip($token);
        $this->assertResponseStatusCodeSame(201);

        // Update
        $this->client->request('PUT', "/api/trips/$id", [], [], [
            'CONTENT_TYPE' => 'application/json', 'HTTP_AUTHORIZATION' => "Bearer $token",
        ], json_encode(['price' => 42.0]));
        $this->assertResponseIsSuccessful();
        $data = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertEquals(42.0, $data['price']);
    }

    public function testUpdateStatusDispatchesMessage(): void
    {
        $token = $this->getJwt();
        $id    = $this->createTrip($token);

        $this->client->request('POST', "/api/trips/$id/status", [], [], [
            'CONTENT_TYPE' => 'application/json', 'HTTP_AUTHORIZATION' => "Bearer $token",
        ], json_encode(['status' => 'delayed', 'delayMinutes' => 15]));
        $this->assertResponseIsSuccessful();
        $data = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertEquals('delayed', $data['status']);
        $this->assertEquals(15, $data['delayMinutes']);
    }

    public function testDeleteTrip(): void
    {
        $token = $this->getJwt();
        $id    = $this->createTrip($token);

        $this->client->request('DELETE', "/api/trips/$id", [], [], ['HTTP_AUTHORIZATION' => "Bearer $token"]);
        $this->assertResponseStatusCodeSame(204);

        // Vérifier suppression
        $this->client->request('GET', "/api/trips/$id");
        $this->assertResponseStatusCodeSame(404);
    }

    public function testCannotModifyOtherAgencyTrip(): void
    {
        // Créer une 2ème agence
        $hasher = static::getContainer()->get(UserPasswordHasherInterface::class);
        $a2 = new Agency();
        $a2->setName('Other Agency')->setEmail('other@agency.fr')->setCity('Lyon')
           ->setStatus(Agency::STATUS_ACTIVE)->setRoles(['ROLE_AGENCY_ADMIN'])
           ->setPassword($hasher->hashPassword($a2, 'password123'));
        $this->em->persist($a2);
        $this->em->flush();

        // Token de l'agence 1 pour créer un voyage
        $token1 = $this->getJwt();
        $id     = $this->createTrip($token1);

        // Token de l'agence 2 tente de modifier
        $this->client->request('POST', '/api/auth/login', [], [], ['CONTENT_TYPE' => 'application/json'],
            json_encode(['email' => 'other@agency.fr', 'password' => 'password123']));
        $token2 = json_decode($this->client->getResponse()->getContent(), true)['token'];

        $this->client->request('DELETE', "/api/trips/$id", [], [], ['HTTP_AUTHORIZATION' => "Bearer $token2"]);
        $this->assertResponseStatusCodeSame(403);
    }
}
