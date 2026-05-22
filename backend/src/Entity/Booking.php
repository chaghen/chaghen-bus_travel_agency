<?php

namespace App\Entity;

use App\Repository\BookingRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: BookingRepository::class)]
class Booking
{
    const STATUS_CONFIRMED = 'confirmed';
    const STATUS_CANCELLED = 'cancelled';

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 20, unique: true)]
    private string $reference = '';

    #[ORM\ManyToOne(targetEntity: Trip::class)]
    #[ORM\JoinColumn(nullable: false)]
    private Trip $trip;

    #[ORM\Column(type: 'json')]
    private array $passengers = [];

    #[ORM\Column(length: 20)]
    private string $seatClass = 'standard';

    #[ORM\Column]
    private int $extraBags = 0;

    #[ORM\Column(type: 'decimal', precision: 8, scale: 2)]
    private float $totalAmount = 0;

    #[ORM\Column(length: 20)]
    private string $status = self::STATUS_CONFIRMED;

    #[ORM\Column]
    private \DateTimeImmutable $createdAt;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
        $this->reference = 'BX-' . strtoupper(substr(uniqid(), -6));
    }

    public function getId(): ?int { return $this->id; }
    public function getReference(): string { return $this->reference; }
    public function getTrip(): Trip { return $this->trip; }
    public function setTrip(Trip $v): static { $this->trip = $v; return $this; }
    public function getPassengers(): array { return $this->passengers; }
    public function setPassengers(array $v): static { $this->passengers = $v; return $this; }
    public function getSeatClass(): string { return $this->seatClass; }
    public function setSeatClass(string $v): static { $this->seatClass = $v; return $this; }
    public function getExtraBags(): int { return $this->extraBags; }
    public function setExtraBags(int $v): static { $this->extraBags = $v; return $this; }
    public function getTotalAmount(): float { return (float)$this->totalAmount; }
    public function setTotalAmount(float $v): static { $this->totalAmount = $v; return $this; }
    public function getStatus(): string { return $this->status; }
    public function setStatus(string $v): static { $this->status = $v; return $this; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }
}
