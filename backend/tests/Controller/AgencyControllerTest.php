<?php

namespace App\Tests\Controller;

use App\Entity\Agency;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class AgencyControllerTest extends WebTestCase
{
    private $client;
    private EntityManagerInterface $em;

    protected function setUp(): void
    {
        $this->client = static::createClient();
        $this->em     = static::getContainer()->get(EntityManagerInterface::class);
        $this->purge();
        $this->seedAgency();
    }

    private function purge(): void
    {
        $this->em->createQuery('DELETE FROM App\Entity\Trip t')->execute();
        $this->em->createQuery('DELETE FROM App\Entity\Agency a')->execute();
    }

    private function seedAgency(string $status = Agency::STATUS_ACTIVE): Agency
    {
        $hasher = static::getContainer()->get(UserPasswordHasherInterface::class);
        $a = new Agency();
        $a->setName('Test Agency')->setEmail('test@agency.fr')->setCity('Paris')
          ->setStatus($status)->setRoles(['ROLE_AGENCY_ADMIN'])
          ->setPassword($hasher->hashPassword($a, 'password123'));
        $this->em->persist($a);

        // Admin
        $admin = new Agency();
        $admin->setName('Admin')->setEmail('admin@busexpress.fr')->setCity('Paris')
              ->setStatus(Agency::STATUS_ACTIVE)->setRoles(['ROLE_ADMIN', 'ROLE_AGENCY_ADMIN'])
              ->setPassword($hasher->hashPassword($admin, 'password123'));
        $this->em->persist($admin);
        $this->em->flush();
        return $a;
    }

    private function getJwt(string $email, string $password, string $path = '/api/auth/login'): string
    {
        $this->client->request('POST', $path, [], [], ['CONTENT_TYPE' => 'application/json'], json_encode(['email' => $email, 'password' => $password]));
        $data = json_decode($this->client->getResponse()->getContent(), true);
        return $data['token'] ?? '';
    }

    public function testRegisterAgency(): void
    {
        $this->client->request('POST', '/api/auth/register', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'name' => 'Nouvelle Agence', 'email' => 'nouveau@agence.fr', 'password' => 'password123', 'city' => 'Lyon',
        ]));
        $this->assertResponseStatusCodeSame(201);
        $data = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertArrayHasKey('id', $data);

        // Vérifie que l'agence est en BD avec status pending
        $agency = $this->em->getRepository(Agency::class)->findOneBy(['email' => 'nouveau@agence.fr']);
        $this->assertNotNull($agency);
        $this->assertEquals(Agency::STATUS_PENDING, $agency->getStatus());
        $this->assertContains('ROLE_AGENCY_ADMIN', $agency->getRoles());
    }

    public function testRegisterDuplicateEmail(): void
    {
        $this->client->request('POST', '/api/auth/register', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'name' => 'Doublon', 'email' => 'test@agency.fr', 'password' => 'password123',
        ]));
        $this->assertResponseStatusCodeSame(409);
    }

    public function testGetAgencies(): void
    {
        $this->client->request('GET', '/api/agencies');
        $this->assertResponseIsSuccessful();
        $agencies = json_decode($this->client->getResponse()->getContent(), true);
        // Seules les agences actives apparaissent
        foreach ($agencies as $a) {
            $this->assertArrayNotHasKey('status', $a); // non exposé en public
        }
    }

    public function testLoginAgency(): void
    {
        $token = $this->getJwt('test@agency.fr', 'password123');
        $this->assertNotEmpty($token);
    }

    public function testAdminActivateAgency(): void
    {
        // Créer une agence pending
        $this->client->request('POST', '/api/auth/register', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'name' => 'Pending Co', 'email' => 'pending@test.fr', 'password' => 'password123',
        ]));
        $id = json_decode($this->client->getResponse()->getContent(), true)['id'];

        // Login admin
        $token = $this->getJwt('admin@busexpress.fr', 'password123');

        // Activation
        $this->client->request('POST', "/api/admin/agencies/$id/activate", [], [], [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_AUTHORIZATION' => "Bearer $token",
        ]);
        $this->assertResponseIsSuccessful();
        $data = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertEquals(Agency::STATUS_ACTIVE, $data['status']);
    }

    public function testAdminActivateRequiresAdminRole(): void
    {
        $token = $this->getJwt('test@agency.fr', 'password123');
        $this->client->request('POST', '/api/admin/agencies/1/activate', [], [], [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_AUTHORIZATION' => "Bearer $token",
        ]);
        $this->assertResponseStatusCodeSame(403);
    }

    public function testPromoteDemote(): void
    {
        $token = $this->getJwt('admin@busexpress.fr', 'password123');
        $agency = $this->em->getRepository(Agency::class)->findOneBy(['email' => 'test@agency.fr']);

        // Promote
        $this->client->request('POST', "/api/admin/agencies/{$agency->getId()}/promote", [], [], [
            'CONTENT_TYPE' => 'application/json', 'HTTP_AUTHORIZATION' => "Bearer $token",
        ]);
        $this->assertResponseIsSuccessful();
        $this->em->refresh($agency);
        $this->assertTrue($agency->isAdmin());

        // Demote
        $this->client->request('POST', "/api/admin/agencies/{$agency->getId()}/demote", [], [], [
            'CONTENT_TYPE' => 'application/json', 'HTTP_AUTHORIZATION' => "Bearer $token",
        ]);
        $this->assertResponseIsSuccessful();
        $this->em->refresh($agency);
        $this->assertFalse($agency->isAdmin());
    }
}
