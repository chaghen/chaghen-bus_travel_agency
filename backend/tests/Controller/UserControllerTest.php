<?php

namespace App\Tests\Controller;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class UserControllerTest extends WebTestCase
{
    private $client;
    private EntityManagerInterface $em;

    protected function setUp(): void
    {
        $this->client = static::createClient();
        $this->em     = static::getContainer()->get(EntityManagerInterface::class);
        $this->em->createQuery('DELETE FROM App\Entity\User u')->execute();
    }

    private function getJwt(string $email, string $password): string
    {
        $this->client->request('POST', '/api/auth/login-user', [], [], ['CONTENT_TYPE' => 'application/json'],
            json_encode(['email' => $email, 'password' => $password]));
        return json_decode($this->client->getResponse()->getContent(), true)['token'] ?? '';
    }

    public function testRegisterUser(): void
    {
        $this->client->request('POST', '/api/auth/register-user', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'email' => 'jean@test.fr', 'password' => 'password123',
            'firstName' => 'Jean', 'lastName' => 'Dupont', 'phone' => '0612345678',
        ]));
        $this->assertResponseStatusCodeSame(201);
        $data = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertEquals('jean@test.fr', $data['email']);

        // Vérifier en BD
        $user = $this->em->getRepository(User::class)->findOneBy(['email' => 'jean@test.fr']);
        $this->assertNotNull($user);
        $this->assertEquals('Jean', $user->getFirstName());
        $this->assertContains('ROLE_USER', $user->getRoles());
    }

    public function testRegisterDuplicateEmail(): void
    {
        $this->client->request('POST', '/api/auth/register-user', [], [], ['CONTENT_TYPE' => 'application/json'],
            json_encode(['email' => 'dup@test.fr', 'password' => 'pass']));
        $this->client->request('POST', '/api/auth/register-user', [], [], ['CONTENT_TYPE' => 'application/json'],
            json_encode(['email' => 'dup@test.fr', 'password' => 'pass']));
        $this->assertResponseStatusCodeSame(409);
    }

    public function testLoginUser(): void
    {
        // Register d'abord
        $this->client->request('POST', '/api/auth/register-user', [], [], ['CONTENT_TYPE' => 'application/json'],
            json_encode(['email' => 'user@test.fr', 'password' => 'password123']));

        $token = $this->getJwt('user@test.fr', 'password123');
        $this->assertNotEmpty($token);
    }

    public function testGetMeRequiresAuth(): void
    {
        $this->client->request('GET', '/api/user/me');
        $this->assertResponseStatusCodeSame(401);
    }

    public function testGetMe(): void
    {
        $this->client->request('POST', '/api/auth/register-user', [], [], ['CONTENT_TYPE' => 'application/json'],
            json_encode(['email' => 'me@test.fr', 'password' => 'password123', 'firstName' => 'Marie', 'lastName' => 'Martin']));

        $token = $this->getJwt('me@test.fr', 'password123');
        $this->client->request('GET', '/api/user/me', [], [], ['HTTP_AUTHORIZATION' => "Bearer $token"]);
        $this->assertResponseIsSuccessful();
        $data = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertEquals('Marie', $data['firstName']);
        $this->assertEquals('Martin', $data['lastName']);
        $this->assertEquals('Marie Martin', $data['fullName']);
    }

    public function testUpdateProfile(): void
    {
        $this->client->request('POST', '/api/auth/register-user', [], [], ['CONTENT_TYPE' => 'application/json'],
            json_encode(['email' => 'upd@test.fr', 'password' => 'password123']));
        $token = $this->getJwt('upd@test.fr', 'password123');

        $this->client->request('PUT', '/api/user/me', [], [], [
            'CONTENT_TYPE' => 'application/json', 'HTTP_AUTHORIZATION' => "Bearer $token",
        ], json_encode(['firstName' => 'Updated', 'phone' => '0601020304']));

        $this->assertResponseIsSuccessful();
        $data = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertEquals('Updated', $data['firstName']);
        $this->assertEquals('0601020304', $data['phone']);
    }
}
