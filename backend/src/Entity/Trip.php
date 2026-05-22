<?php

namespace App\Entity;

use App\Repository\TripRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: TripRepository::class)]
#[ORM\HasLifecycleCallbacks]
class Trip
{
    const STATUS_ON_TIME   = 'on_time';
    const STATUS_DELAYED   = 'delayed';
    const STATUS_BOARDING  = 'boarding';
    const STATUS_DEPARTED  = 'departed';
    const STATUS_CANCELLED = 'cancelled';

    const TYPE_STANDARD  = 'standard';
    const TYPE_PREMIUM   = 'premium';
    const TYPE_LUXURY    = 'luxury';
    const TYPE_COUCHETTE = 'couchette';

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Agency::class, inversedBy: 'trips')]
    #[ORM\JoinColumn(nullable: false)]
    private Agency $agency;

    #[ORM\Column(length: 100)]
    private string $fromCity = '';

    #[ORM\Column(length: 100)]
    private string $toCity = '';

    #[ORM\Column(type: 'date_immutable')]
    private \DateTimeImmutable $date;

    #[ORM\Column(type: 'time_immutable')]
    private \DateTimeImmutable $departureTime;

    #[ORM\Column(type: 'time_immutable')]
    private \DateTimeImmutable $arrivalTime;

    #[ORM\Column(length: 20)]
    private string $duration = '';

    #[ORM\Column(type: 'decimal', precision: 8, scale: 2)]
    private float $price = 0;

    #[ORM\Column(type: 'decimal', precision: 8, scale: 2, nullable: true)]
    private ?float $vipPrice = null;

    #[ORM\Column(length: 20)]
    private string $type = self::TYPE_STANDARD;

    #[ORM\Column(length: 50, nullable: true)]
    private ?string $platform = null;

    #[ORM\Column]
    private int $totalSeats = 50;

    #[ORM\Column]
    private int $availableSeats = 50;

    #[ORM\Column(length: 20)]
    private string $status = self::STATUS_ON_TIME;

    #[ORM\Column]
    private int $delayMinutes = 0;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $description = null;

    #[ORM\Column(type: 'json')]
    private array $amenities = [];

    #[ORM\Column(type: 'json')]
    private array $stops = [];

    #[ORM\Column]
    private int $baggageAllowance = 20;

    #[ORM\Column(type: 'decimal', precision: 6, scale: 2)]
    private float $extraBaggagePrice = 5.0;

    #[ORM\Column]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $updatedAt = null;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
        $this->date      = new \DateTimeImmutable();
        $this->departureTime = new \DateTimeImmutable();
        $this->arrivalTime   = new \DateTimeImmutable();
    }

    #[ORM\PreUpdate]
    public function onPreUpdate(): void { $this->updatedAt = new \DateTimeImmutable(); }

    public function getId(): ?int { return $this->id; }
    public function getAgency(): Agency { return $this->agency; }
    public function setAgency(Agency $v): static { $this->agency = $v; return $this; }
    public function getFromCity(): string { return $this->fromCity; }
    public function setFromCity(string $v): static { $this->fromCity = $v; return $this; }
    public function getToCity(): string { return $this->toCity; }
    public function setToCity(string $v): static { $this->toCity = $v; return $this; }
    public function getDate(): \DateTimeImmutable { return $this->date; }
    public function setDate(\DateTimeImmutable $v): static { $this->date = $v; return $this; }
    public function getDepartureTime(): \DateTimeImmutable { return $this->departureTime; }
    public function setDepartureTime(\DateTimeImmutable $v): static { $this->departureTime = $v; return $this; }
    public function getArrivalTime(): \DateTimeImmutable { return $this->arrivalTime; }
    public function setArrivalTime(\DateTimeImmutable $v): static { $this->arrivalTime = $v; return $this; }
    public function getDuration(): string { return $this->duration; }
    public function setDuration(string $v): static { $this->duration = $v; return $this; }
    public function getPrice(): float { return (float)$this->price; }
    public function setPrice(float $v): static { $this->price = $v; return $this; }
    public function getVipPrice(): ?float { return $this->vipPrice !== null ? (float)$this->vipPrice : null; }
    public function setVipPrice(?float $v): static { $this->vipPrice = $v; return $this; }
    public function getType(): string { return $this->type; }
    public function setType(string $v): static { $this->type = $v; return $this; }
    public function getPlatform(): ?string { return $this->platform; }
    public function setPlatform(?string $v): static { $this->platform = $v; return $this; }
    public function getTotalSeats(): int { return $this->totalSeats; }
    public function setTotalSeats(int $v): static { $this->totalSeats = $v; return $this; }
    public function getAvailableSeats(): int { return $this->availableSeats; }
    public function setAvailableSeats(int $v): static { $this->availableSeats = $v; return $this; }
    public function getStatus(): string { return $this->status; }
    public function setStatus(string $v): static { $this->status = $v; return $this; }
    public function getDelayMinutes(): int { return $this->delayMinutes; }
    public function setDelayMinutes(int $v): static { $this->delayMinutes = $v; return $this; }
    public function getDescription(): ?string { return $this->description; }
    public function setDescription(?string $v): static { $this->description = $v; return $this; }
    public function getAmenities(): array { return $this->amenities; }
    public function setAmenities(array $v): static { $this->amenities = $v; return $this; }
    public function getStops(): array { return $this->stops; }
    public function setStops(array $v): static { $this->stops = $v; return $this; }
    public function getBaggageAllowance(): int { return $this->baggageAllowance; }
    public function setBaggageAllowance(int $v): static { $this->baggageAllowance = $v; return $this; }
    public function getExtraBaggagePrice(): float { return (float)$this->extraBaggagePrice; }
    public function setExtraBaggagePrice(float $v): static { $this->extraBaggagePrice = $v; return $this; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }
    public function getUpdatedAt(): ?\DateTimeImmutable { return $this->updatedAt; }
}
