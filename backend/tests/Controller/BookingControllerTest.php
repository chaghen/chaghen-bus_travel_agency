<?php

namespace App\Tests\Controller;

use App\Entity\Agency;
use App\Entity\Trip;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class BookingControllerTest extends WebTestCase
{
    private $client;
    private EntityManagerInterface $em;
    private Trip $trip;

    protected function setUp(): void
    {
        $this->client = static::createClient();
        $this->em     = static::getContainer()->get(EntityManagerInterface::class);
        $this->purge();
        $this->trip = $this->seed();
    }

    private function purge(): void
    {
        $this->em->createQuery('DELETE FROM App\Entity\Booking b')->execute();
        $this->em->createQuery('DELETE FROM App\Entity\Trip t')->execute();
        $this->em->createQuery('DELETE FROM App\Entity\Agency a')->execute();
    }

    private function seed(): Trip
    {
        $hasher = static::getContainer()->get(UserPasswordHasherInterface::class);
        $a = new Agency();
        $a->setName('Test Agency')->setEmail('ag@test.fr')->setCity('Paris')
          ->setStatus(Agency::STATUS_ACTIVE)->setRoles(['ROLE_AGENCY_ADMIN'])
          ->setPassword($hasher->hashPassword($a, 'pw'));
        $this->em->persist($a);

        $t = new Trip();
        $t->setAgency($a)->setFromCity('Paris')->setToCity('Lyon')
          ->setDate(new \DateTimeImmutable('today'))
          ->setDepartureTime(new \DateTimeImmutable('today 09:00'))
          ->setArrivalTime(new \DateTimeImmutable('today 13:00'))
          ->setDuration('4h00')->setPrice(35.0)->setType('standard')
          ->setPlatform('Quai 1')->setTotalSeats(10)->setAvailableSeats(10)
          ->setBaggageAllowance(20)->setExtraBaggagePrice(6.0)
          ->setStatus('on_time');
        $this->em->persist($t);
        $this->em->flush();
        return $t;
    }

    private function book(int $tripId, int $nbPass = 1, string $seatClass = 'standard'): array
    {
        $passengers = array_fill(0, $nbPass, ['firstName' => 'Jean', 'lastName' => 'Dupont', 'email' => 'jean@test.fr']);
        $this->client->request('POST', '/api/bookings', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'tripId' => $tripId, 'passengers' => $passengers, 'seatClass' => $seatClass, 'extraBags' => 0,
        ]));
        return json_decode($this->client->getResponse()->getContent(), true);
    }

    public function testCreateBooking(): void
    {
        $data = $this->book($this->trip->getId());
        $this->assertResponseStatusCodeSame(201);
        $this->assertArrayHasKey('reference', $data);
        $this->assertStringStartsWith('BX-', $data['reference']);
        $this->assertEquals(35.0, $data['totalAmount']);

        // Places décrémentées
        $this->em->refresh($this->trip);
        $this->assertEquals(9, $this->trip->getAvailableSeats());
    }

    public function testCreateBookingMultiplePassengers(): void
    {
        $data = $this->book($this->trip->getId(), 3);
        $this->assertResponseStatusCodeSame(201);
        $this->assertEquals(3 * 35.0, $data['totalAmount']);
        $this->em->refresh($this->trip);
        $this->assertEquals(7, $this->trip->getAvailableSeats());
    }

    public function testGetBookingByReference(): void
    {
        $created = $this->book($this->trip->getId());
        $ref     = $created['reference'];

        $this->client->request('GET', "/api/bookings/$ref");
        $this->assertResponseIsSuccessful();
        $data = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertEquals($ref, $data['reference']);
        $this->assertEquals('confirmed', $data['status']);
    }

    public function testCancelBookingRestoresSeats(): void
    {
        $ref = $this->book($this->trip->getId(), 2)['reference'];

        $this->client->request('POST', "/api/bookings/$ref/cancel");
        $this->assertResponseIsSuccessful();
        $data = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertEquals('cancelled', $data['status']);

        // Places restituées
        $this->em->refresh($this->trip);
        $this->assertEquals(10, $this->trip->getAvailableSeats());
    }

    public function testCannotBookMoreThanAvailableSeats(): void
    {
        // Saturer les places (10 places, on book 10)
        $this->book($this->trip->getId(), 10);
        // Essayer d'en book encore
        $this->book($this->trip->getId(), 1);
        $this->assertResponseStatusCodeSame(409);
    }

    public function testCannotBookCancelledTrip(): void
    {
        $this->trip->setStatus('cancelled');
        $this->em->flush();

        $this->book($this->trip->getId());
        $this->assertResponseStatusCodeSame(409);
    }

    public function testBookingReference404(): void
    {
        $this->client->request('GET', '/api/bookings/BX-XXXXXX');
        $this->assertResponseStatusCodeSame(404);
    }
}
