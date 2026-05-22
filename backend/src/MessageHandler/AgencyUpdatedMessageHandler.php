<?php

namespace App\MessageHandler;

use App\Message\AgencyUpdatedMessage;
use App\Repository\AgencyRepository;
use Psr\Log\LoggerInterface;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler]
class AgencyUpdatedMessageHandler
{
    public function __construct(
        private readonly AgencyRepository $agencyRepository,
        private readonly \Redis           $redis,
        private readonly LoggerInterface  $logger,
    ) {}

    public function __invoke(AgencyUpdatedMessage $message): void
    {
        $action   = $message->getAction();
        $agencyId = $message->getAgencyId();
        $agency   = $this->agencyRepository->find($agencyId);

        $data = [
            'id'     => $agencyId,
            'action' => $action,
        ];

        if ($agency) {
            $data = array_merge($data, [
                'name'        => $agency->getName(),
                'city'        => $agency->getCity(),
                'description' => $agency->getDescription(),
                'rating'      => $agency->getRating(),
                'colors'      => $agency->getColors(),
                'status'      => $agency->getStatus(),
                'tripsCount'  => $agency->getTrips()->count(),
            ]);
        }

        $payload = json_encode(['event' => 'agency:updated', 'data' => $data]);
        $this->redis->publish('busexpress:agencies', $payload);

        $this->logger->info('Agency event published', ['action' => $action, 'id' => $agencyId]);
    }
}
