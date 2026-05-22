<?php

namespace App\Controller;

use App\Entity\Agency;
use App\Message\AgencyUpdatedMessage;
use App\Repository\AgencyRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Messenger\MessageBusInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api')]
class AgencyController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface      $em,
        private readonly AgencyRepository            $agencyRepository,
        private readonly UserPasswordHasherInterface $hasher,
        private readonly MessageBusInterface         $bus,
    ) {}

    /** POST /api/auth/login — route requise par le firewall json_login */
    #[Route('/auth/login', methods: ['POST'])]
    public function login(): JsonResponse
    {
        return $this->json(['error' => 'Authentification échouée'], 401);
    }

    /** POST /api/auth/register — inscription agence */
    #[Route('/auth/register', methods: ['POST'])]
    public function register(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        if (!($data['email'] ?? null) || !($data['password'] ?? null) || !($data['name'] ?? null)) {
            return $this->json(['error' => 'name, email et password requis'], 400);
        }

        if ($this->agencyRepository->findOneBy(['email' => $data['email']])) {
            return $this->json(['error' => 'Email déjà utilisé'], 409);
        }

        $agency = new Agency();
        $agency->setName($data['name']);
        $agency->setEmail($data['email']);
        $agency->setPassword($this->hasher->hashPassword($agency, $data['password']));
        $agency->setPhone($data['phone'] ?? null);
        $agency->setCity($data['city'] ?? null);
        $agency->setDescription($data['description'] ?? null);
        $agency->setSiret($data['siret'] ?? null);
        $agency->setStatus(Agency::STATUS_PENDING);
        $agency->setRoles(['ROLE_AGENCY_ADMIN']);

        $this->em->persist($agency);
        $this->em->flush();

        // Notifier l'admin en temps réel qu'une nouvelle agence est en attente
        $this->bus->dispatch(new AgencyUpdatedMessage($agency->getId(), 'created'));

        return $this->json([
            'message' => 'Inscription envoyée, en attente de validation',
            'id'      => $agency->getId(),
        ], 201);
    }

    /** GET /api/agencies */
    #[Route('/agencies', methods: ['GET'])]
    public function list(): JsonResponse
    {
        $agencies = $this->agencyRepository->findBy(['status' => Agency::STATUS_ACTIVE]);
        return $this->json(array_map(fn($a) => $this->serialize($a), $agencies));
    }

    /** GET /api/agencies/{id} */
    #[Route('/agencies/{id}', methods: ['GET'])]
    public function show(Agency $agency): JsonResponse
    {
        if ($agency->getStatus() !== Agency::STATUS_ACTIVE) {
            return $this->json(['error' => 'Agence non disponible'], 404);
        }
        return $this->json($this->serialize($agency));
    }

    /** PUT /api/agencies/{id} */
    #[Route('/agencies/{id}', methods: ['PUT'])]
    #[IsGranted('ROLE_AGENCY_ADMIN')]
    public function update(Agency $agency, Request $request): JsonResponse
    {
        /** @var Agency $currentUser */
        $currentUser = $this->getUser();
        if ($currentUser->getId() !== $agency->getId() && !in_array('ROLE_ADMIN', $currentUser->getRoles())) {
            return $this->json(['error' => 'Accès refusé'], 403);
        }
        $data = json_decode($request->getContent(), true);
        if (isset($data['name']))        $agency->setName($data['name']);
        if (isset($data['phone']))       $agency->setPhone($data['phone']);
        if (isset($data['city']))        $agency->setCity($data['city']);
        if (isset($data['description'])) $agency->setDescription($data['description']);
        $this->em->flush();
        return $this->json($this->serialize($agency));
    }

    /** GET /api/admin/agencies */
    #[Route('/admin/agencies', methods: ['GET'])]
    #[IsGranted('ROLE_ADMIN')]
    public function adminList(): JsonResponse
    {
        $agencies = $this->agencyRepository->findAll();
        return $this->json(array_map(fn($a) => $this->serialize($a, true), $agencies));
    }

    /** POST /api/admin/agencies/{id}/activate */
    #[Route('/admin/agencies/{id}/activate', methods: ['POST'])]
    #[IsGranted('ROLE_ADMIN')]
    public function activate(Agency $agency): JsonResponse
    {
        $agency->setStatus(Agency::STATUS_ACTIVE);
        $this->em->flush();

        // Notifier en temps réel — la liste publique des agences se met à jour
        $this->bus->dispatch(new AgencyUpdatedMessage($agency->getId(), 'activated'));

        return $this->json($this->serialize($agency, true));
    }

    /** POST /api/admin/agencies/{id}/deactivate */
    #[Route('/admin/agencies/{id}/deactivate', methods: ['POST'])]
    #[IsGranted('ROLE_ADMIN')]
    public function deactivate(Agency $agency): JsonResponse
    {
        $agency->setStatus(Agency::STATUS_INACTIVE);
        $this->em->flush();

        // Notifier en temps réel — l'agence disparaît de la liste publique
        $this->bus->dispatch(new AgencyUpdatedMessage($agency->getId(), 'deactivated'));

        return $this->json($this->serialize($agency, true));
    }

    /** POST /api/admin/agencies/{id}/promote */
    #[Route('/admin/agencies/{id}/promote', methods: ['POST'])]
    #[IsGranted('ROLE_ADMIN')]
    public function promote(Agency $agency): JsonResponse
    {
        $roles = $agency->getRoles();
        if (!in_array('ROLE_ADMIN', $roles)) {
            $roles[] = 'ROLE_ADMIN';
            $agency->setRoles(array_unique($roles));
            $this->em->flush();
        }
        return $this->json($this->serialize($agency, true));
    }

    /** POST /api/admin/agencies/{id}/demote */
    #[Route('/admin/agencies/{id}/demote', methods: ['POST'])]
    #[IsGranted('ROLE_ADMIN')]
    public function demote(Agency $agency): JsonResponse
    {
        $agency->setRoles(['ROLE_AGENCY_ADMIN']);
        $this->em->flush();
        return $this->json($this->serialize($agency, true));
    }

    private function serialize(Agency $a, bool $admin = false): array
    {
        $data = [
            'id'          => $a->getId(),
            'name'        => $a->getName(),
            'city'        => $a->getCity(),
            'description' => $a->getDescription(),
            'rating'      => $a->getRating(),
            'colors'      => $a->getColors(),
            'tripsCount'  => $a->getTrips()->count(),
        ];
        if ($admin) {
            $data['email']     = $a->getEmail();
            $data['phone']     = $a->getPhone();
            $data['status']    = $a->getStatus();
            $data['siret']     = $a->getSiret();
            $data['roles']     = $a->getRoles();
            $data['isAdmin']   = $a->isAdmin();
            $data['createdAt'] = $a->getCreatedAt()->format(\DateTimeInterface::ATOM);
        }
        return $data;
    }
}
