<?php

namespace App\Controller;

use App\Entity\Booking;
use App\Entity\Trip;
use App\Repository\BookingRepository;
use App\Repository\TripRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/bookings')]
class BookingController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly BookingRepository      $bookingRepository,
        private readonly TripRepository         $tripRepository,
    ) {}

    /** POST /api/bookings */
    #[Route('', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        $trip = $this->tripRepository->find($data['tripId'] ?? 0);
        if (!$trip) return $this->json(['error' => 'Voyage introuvable'], 404);
        if ($trip->getStatus() === Trip::STATUS_CANCELLED) return $this->json(['error' => 'Voyage annulé'], 409);

        $passengers  = $data['passengers'] ?? [];
        $nb          = count($passengers);
        if ($nb < 1 || $nb > 6) return $this->json(['error' => '1 à 6 passagers'], 400);
        if ($trip->getAvailableSeats() < $nb) return $this->json(['error' => 'Plus de places'], 409);

        $seatClass = $data['seatClass'] ?? 'standard';
        $extraBags = max(0, (int)($data['extraBags'] ?? 0));
        $basePrice = ($seatClass === 'vip' && $trip->getVipPrice()) ? $trip->getVipPrice() : $trip->getPrice();
        $total     = ($basePrice * $nb) + ($extraBags * $trip->getExtraBaggagePrice());

        $booking = new Booking();
        $booking->setTrip($trip);
        $booking->setPassengers($passengers);
        $booking->setSeatClass($seatClass);
        $booking->setExtraBags($extraBags);
        $booking->setTotalAmount($total);

        $trip->setAvailableSeats($trip->getAvailableSeats() - $nb);

        $this->em->persist($booking);
        $this->em->flush();

        return $this->json([
            'reference'   => $booking->getReference(),
            'totalAmount' => $total,
            'trip'        => [
                'from'          => $trip->getFromCity(),
                'to'            => $trip->getToCity(),
                'date'          => $trip->getDate()->format('Y-m-d'),
                'departureTime' => $trip->getDepartureTime()->format('H:i'),
                'agency'        => $trip->getAgency()->getName(),
            ],
            'passengers'  => $nb,
            'seatClass'   => $seatClass,
        ], 201);
    }

    /** GET /api/bookings/{reference} */
    #[Route('/{reference}', methods: ['GET'])]
    public function show(string $reference): JsonResponse
    {
        $booking = $this->bookingRepository->findOneBy(['reference' => $reference]);
        if (!$booking) return $this->json(['error' => 'Réservation introuvable'], 404);

        return $this->json([
            'reference'   => $booking->getReference(),
            'status'      => $booking->getStatus(),
            'passengers'  => $booking->getPassengers(),
            'seatClass'   => $booking->getSeatClass(),
            'extraBags'   => $booking->getExtraBags(),
            'totalAmount' => $booking->getTotalAmount(),
            'createdAt'   => $booking->getCreatedAt()->format(\DateTimeInterface::ATOM),
            'trip'        => [
                'from'          => $booking->getTrip()->getFromCity(),
                'to'            => $booking->getTrip()->getToCity(),
                'date'          => $booking->getTrip()->getDate()->format('Y-m-d'),
                'departureTime' => $booking->getTrip()->getDepartureTime()->format('H:i'),
                'agency'        => $booking->getTrip()->getAgency()->getName(),
            ],
        ]);
    }

    /** POST /api/bookings/{reference}/cancel */
    #[Route('/{reference}/cancel', methods: ['POST'])]
    public function cancel(string $reference): JsonResponse
    {
        $booking = $this->bookingRepository->findOneBy(['reference' => $reference]);
        if (!$booking) return $this->json(['error' => 'Réservation introuvable'], 404);
        if ($booking->getStatus() === Booking::STATUS_CANCELLED) return $this->json(['error' => 'Déjà annulée'], 409);

        $booking->setStatus(Booking::STATUS_CANCELLED);
        $trip = $booking->getTrip();
        $trip->setAvailableSeats($trip->getAvailableSeats() + count($booking->getPassengers()));
        $this->em->flush();

        return $this->json(['status' => 'cancelled', 'reference' => $reference]);
    }
}
