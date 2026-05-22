<?php

namespace App\EventListener;

use App\Entity\Agency;
use App\Entity\User;
use Lexik\Bundle\JWTAuthenticationBundle\Event\JWTCreatedEvent;
use Symfony\Component\EventDispatcher\Attribute\AsEventListener;

#[AsEventListener(event: 'lexik_jwt_authentication.on_jwt_created')]
class JwtCreatedListener
{
    public function __invoke(JWTCreatedEvent $event): void
    {
        $user    = $event->getUser();
        $payload = $event->getData();

        if ($user instanceof Agency) {
            $payload['roles']     = $user->getRoles();
            $payload['name']      = $user->getName();
            $payload['agencyId']  = $user->getId();
            $payload['type']      = 'agency';
        }

        if ($user instanceof User) {
            $payload['roles']     = $user->getRoles();
            $payload['firstName'] = $user->getFirstName() ?? '';
            $payload['lastName']  = $user->getLastName()  ?? '';
            $payload['name']      = $user->getFullName();
            $payload['type']      = 'user';
        }

        $event->setData($payload);
    }
}
