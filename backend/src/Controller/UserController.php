<?php

namespace App\Controller;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api')]
class UserController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface      $em,
        private readonly UserRepository              $userRepository,
        private readonly UserPasswordHasherInterface $hasher,
    ) {}

    /**
     * POST /api/auth/login-user
     *
     * Cette route DOIT exister pour que le firewall json_login de Symfony
     * puisse l'intercepter. Le firewall prend la main avant le controller
     * et renvoie lui-même le JWT — ce code n'est jamais exécuté en cas de
     * succès, mais la route doit être déclarée pour que Symfony la connaisse.
     */
    #[Route('/auth/login-user', methods: ['POST'])]
    public function loginUser(): JsonResponse
    {
        // Le firewall json_login intercepte avant d'arriver ici.
        // Si on arrive ici c'est que quelque chose s'est mal passé.
        return $this->json(['error' => 'Authentification échouée'], 401);
    }

    /**
     * POST /api/auth/register-user
     * Inscription d'un voyageur (ROLE_USER)
     */
    #[Route('/auth/register-user', methods: ['POST'])]
    public function register(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (empty($data['email']) || empty($data['password'])) {
            return $this->json(['error' => 'email et password requis'], 400);
        }

        if ($this->userRepository->findOneBy(['email' => $data['email']])) {
            return $this->json(['error' => 'Email déjà utilisé'], 409);
        }

        $user = new User();
        $user->setEmail($data['email']);
        $user->setPassword($this->hasher->hashPassword($user, $data['password']));
        $user->setFirstName($data['firstName'] ?? null);
        $user->setLastName($data['lastName']  ?? null);
        $user->setPhone($data['phone']        ?? null);

        $this->em->persist($user);
        $this->em->flush();

        return $this->json([
            'message' => 'Compte créé avec succès',
            'id'      => $user->getId(),
            'email'   => $user->getEmail(),
        ], 201);
    }

    /**
     * GET /api/user/me
     */
    #[Route('/user/me', methods: ['GET'])]
    #[IsGranted('ROLE_USER')]
    public function me(): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();
        return $this->json([
            'id'        => $user->getId(),
            'email'     => $user->getEmail(),
            'firstName' => $user->getFirstName(),
            'lastName'  => $user->getLastName(),
            'phone'     => $user->getPhone(),
            'fullName'  => $user->getFullName(),
        ]);
    }

    /**
     * PUT /api/user/me
     */
    #[Route('/user/me', methods: ['PUT'])]
    #[IsGranted('ROLE_USER')]
    public function update(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();
        $data = json_decode($request->getContent(), true);

        if (isset($data['firstName'])) $user->setFirstName($data['firstName']);
        if (isset($data['lastName']))  $user->setLastName($data['lastName']);
        if (isset($data['phone']))     $user->setPhone($data['phone']);

        $this->em->flush();

        return $this->json([
            'id'        => $user->getId(),
            'email'     => $user->getEmail(),
            'firstName' => $user->getFirstName(),
            'lastName'  => $user->getLastName(),
            'phone'     => $user->getPhone(),
        ]);
    }
}
