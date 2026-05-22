<?php

namespace App\Message;

class AgencyUpdatedMessage
{
    public function __construct(
        private readonly int    $agencyId,
        private readonly string $action,   // 'created' | 'activated' | 'deactivated'
    ) {}

    public function getAgencyId(): int    { return $this->agencyId; }
    public function getAction(): string   { return $this->action; }
}
