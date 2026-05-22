<?php

namespace App\Message;

class TripUpdatedMessage
{
    public function __construct(
        private readonly int    $tripId,
        private readonly string $action,
        private readonly array  $payload = [],
    ) {}

    public function getTripId(): int    { return $this->tripId; }
    public function getAction(): string { return $this->action; }
    public function getPayload(): array { return $this->payload; }
}
