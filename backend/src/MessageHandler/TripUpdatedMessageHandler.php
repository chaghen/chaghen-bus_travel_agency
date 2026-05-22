<?php

namespace App\MessageHandler;

use App\Message\TripUpdatedMessage;
use App\Repository\TripRepository;
use Psr\Log\LoggerInterface;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler]
class TripUpdatedMessageHandler
{
    public function __construct(
        private readonly TripRepository  $tripRepository,
        private readonly \Redis          $redis,
        private readonly LoggerInterface $logger,
    ) {}

    public function __invoke(TripUpdatedMessage $message): void
    {
        $action = $message->getAction();
        $tripId = $message->getTripId();

        if ($action === 'deleted') {
            $this->publish('trip:deleted', ['id' => $tripId, 'action' => 'deleted']);
            return;
        }

        $trip = $this->tripRepository->find($tripId);
        if (!$trip) {
            $this->logger->warning('Trip not found for event', ['id' => $tripId]);
            return;
        }

        $data = [
            'id'             => $trip->getId(),
            'agency'         => [
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
            'amenities'         => $trip->getAmenities(),
            'stops'             => $trip->getStops(),
            'baggageAllowance'  => $trip->getBaggageAllowance(),
            'extraBaggagePrice' => $trip->getExtraBaggagePrice(),
        ];

        if ($action === 'status') {
            $data = array_merge($data, $message->getPayload());
        }

        $event = match ($action) {
            'created' => 'trip:created',
            'status'  => 'trip:status',
            default   => 'trip:updated',
        };

        $this->publish($event, $data);
    }

    private function publish(string $event, array $data): void
    {
        $payload = json_encode(['event' => $event, 'data' => $data]);
        $this->redis->publish('busexpress:trips', $payload);
        $this->logger->info('Published trip event', ['event' => $event]);
    }
}
