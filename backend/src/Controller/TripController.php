<?php

namespace App\Controller;

use App\Entity\Agency;
use App\Entity\Trip;
use App\Message\TripUpdatedMessage;
use App\Repository\TripRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Messenger\MessageBusInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/trips')]
class TripController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly TripRepository         $tripRepository,
        private readonly MessageBusInterface    $bus,
    ) {}

    /** GET /api/trips?fromCity=&toCity=&date=&type=&agencyId=&sortBy= */
    #[Route('', methods: ['GET'])]
    public function index(Request $request): JsonResponse
    {
        $filters = array_filter([
            'fromCity' => $request->query->get('fromCity'),
            'toCity'   => $request->query->get('toCity'),
            'date'     => $request->query->get('date'),
            'type'     => $request->query->get('type'),
            'agencyId' => $request->query->get('agencyId'),
            'minPrice' => $request->query->get('minPrice'),
            'maxPrice' => $request->query->get('maxPrice'),
            'sortBy'   => $request->query->get('sortBy', 'departureTime'),
        ]);

        $trips = $this->tripRepository->search($filters);
        return $this->json(array_map(fn($t) => $this->serializeTrip($t), $trips));
    }

    /** GET /api/trips/{id} */
    #[Route('/{id}', methods: ['GET'])]
    public function show(Trip $trip): JsonResponse
    {
        return $this->json($this->serializeTrip($trip));
    }

    /** POST /api/trips */
    #[Route('', methods: ['POST'])]
    #[IsGranted('ROLE_AGENCY_ADMIN')]
    public function create(Request $request): JsonResponse
    {
        /** @var Agency $agency */
        $agency = $this->getUser();
        $data   = json_decode($request->getContent(), true);

        $trip = $this->buildTrip(new Trip(), $data);
        $trip->setAgency($agency);

        $this->em->persist($trip);
        $this->em->flush();

        $this->bus->dispatch(new TripUpdatedMessage($trip->getId(), 'created'));

        return $this->json($this->serializeTrip($trip), 201);
    }

    /** PUT /api/trips/{id} */
    #[Route('/{id}', methods: ['PUT'])]
    #[IsGranted('ROLE_AGENCY_ADMIN')]
    public function update(Trip $trip, Request $request): JsonResponse
    {
        /** @var Agency $currentUser */
        $currentUser = $this->getUser();
        if ($trip->getAgency()->getId() !== $currentUser->getId()) {
            return $this->json(['error' => 'Accès refusé'], 403);
        }

        $data = json_decode($request->getContent(), true);
        $this->buildTrip($trip, $data);
        $this->em->flush();

        $this->bus->dispatch(new TripUpdatedMessage($trip->getId(), 'updated'));

        return $this->json($this->serializeTrip($trip));
    }

    /** POST /api/trips/{id}/status */
    #[Route('/{id}/status', methods: ['POST'])]
    #[IsGranted('ROLE_AGENCY_ADMIN')]
    public function updateStatus(Trip $trip, Request $request): JsonResponse
    {
        /** @var Agency $currentUser */
        $currentUser = $this->getUser();
        if ($trip->getAgency()->getId() !== $currentUser->getId()) {
            return $this->json(['error' => 'Accès refusé'], 403);
        }

        $data = json_decode($request->getContent(), true);

        if (!empty($data['status'])) {
            $trip->setStatus($data['status']);
        }
        if (isset($data['delayMinutes'])) {
            $trip->setDelayMinutes((int)$data['delayMinutes']);
        }

        $this->em->flush();

        $this->bus->dispatch(new TripUpdatedMessage($trip->getId(), 'status', [
            'reason'       => $data['reason'] ?? null,
            'delayMinutes' => $trip->getDelayMinutes(),
        ]));

        return $this->json($this->serializeTrip($trip));
    }

    /** DELETE /api/trips/{id} */
    #[Route('/{id}', methods: ['DELETE'])]
    #[IsGranted('ROLE_AGENCY_ADMIN')]
    public function delete(Trip $trip): JsonResponse
    {
        /** @var Agency $currentUser */
        $currentUser = $this->getUser();
        if ($trip->getAgency()->getId() !== $currentUser->getId()) {
            return $this->json(['error' => 'Accès refusé'], 403);
        }

        $id = $trip->getId();
        $this->em->remove($trip);
        $this->em->flush();

        $this->bus->dispatch(new TripUpdatedMessage($id, 'deleted'));

        return $this->json(null, 204);
    }

    private function buildTrip(Trip $trip, array $data): Trip
    {
        if (isset($data['fromCity']))          $trip->setFromCity($data['fromCity']);
        if (isset($data['toCity']))            $trip->setToCity($data['toCity']);
        if (isset($data['date']))              $trip->setDate(new \DateTimeImmutable($data['date']));
        if (isset($data['departureTime']))     $trip->setDepartureTime(new \DateTimeImmutable('today ' . $data['departureTime']));
        if (isset($data['arrivalTime']))       $trip->setArrivalTime(new \DateTimeImmutable('today ' . $data['arrivalTime']));
        if (isset($data['duration']))          $trip->setDuration($data['duration']);
        if (isset($data['price']))             $trip->setPrice((float)$data['price']);
        if (array_key_exists('vipPrice', $data)) $trip->setVipPrice($data['vipPrice'] ? (float)$data['vipPrice'] : null);
        if (isset($data['type']))              $trip->setType($data['type']);
        if (isset($data['platform']))          $trip->setPlatform($data['platform']);
        if (isset($data['totalSeats']))        $trip->setTotalSeats((int)$data['totalSeats']);
        if (isset($data['availableSeats']))    $trip->setAvailableSeats((int)$data['availableSeats']);
        if (isset($data['status']))            $trip->setStatus($data['status']);
        if (isset($data['delayMinutes']))      $trip->setDelayMinutes((int)$data['delayMinutes']);
        if (isset($data['description']))       $trip->setDescription($data['description']);
        if (isset($data['amenities']))         $trip->setAmenities($data['amenities']);
        if (isset($data['stops']))             $trip->setStops($data['stops']);
        if (isset($data['baggageAllowance']))  $trip->setBaggageAllowance((int)$data['baggageAllowance']);
        if (isset($data['extraBaggagePrice'])) $trip->setExtraBaggagePrice((float)$data['extraBaggagePrice']);
        return $trip;
    }

    public function serializeTrip(Trip $trip): array
    {
        return [
            'id'                => $trip->getId(),
            'agency'            => [
                'id'     => $trip->getAgency()->getId(),
                'name'   => $trip->getAgency()->getName(),
                'rating' => $trip->getAgency()->getRating(),
                'colors' => $trip->getAgency()->getColors(),
            ],
            'fromCity'          => $trip->getFromCity(),
            'toCity'            => $trip->getToCity(),
            'date'              => $trip->getDate()->format('Y-m-d'),
            'departureTime'     => $trip->getDepartureTime()->format('H:i'),
            'arrivalTime'       => $trip->getArrivalTime()->format('H:i'),
            'duration'          => $trip->getDuration(),
            'price'             => $trip->getPrice(),
            'vipPrice'          => $trip->getVipPrice(),
            'type'              => $trip->getType(),
            'platform'          => $trip->getPlatform(),
            'totalSeats'        => $trip->getTotalSeats(),
            'availableSeats'    => $trip->getAvailableSeats(),
            'status'            => $trip->getStatus(),
            'delayMinutes'      => $trip->getDelayMinutes(),
            'description'       => $trip->getDescription(),
            'amenities'         => $trip->getAmenities(),
            'stops'             => $trip->getStops(),
            'baggageAllowance'  => $trip->getBaggageAllowance(),
            'extraBaggagePrice' => $trip->getExtraBaggagePrice(),
        ];
    }
}
