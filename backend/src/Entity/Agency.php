<?php

namespace App\Entity;

use App\Repository\AgencyRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\UserInterface;

#[ORM\Entity(repositoryClass: AgencyRepository::class)]
#[ORM\HasLifecycleCallbacks]
class Agency implements UserInterface, PasswordAuthenticatedUserInterface
{
    const STATUS_PENDING  = 'pending';
    const STATUS_ACTIVE   = 'active';
    const STATUS_INACTIVE = 'inactive';

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    private string $name = '';

    #[ORM\Column(length: 180, unique: true)]
    private string $email = '';

    #[ORM\Column]
    private string $password = '';

    #[ORM\Column(length: 20, nullable: true)]
    private ?string $phone = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $city = null;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $description = null;

    #[ORM\Column(length: 20)]
    private string $status = self::STATUS_PENDING;

    #[ORM\Column(type: 'decimal', precision: 3, scale: 1, nullable: true)]
    private ?string $rating = null;

    #[ORM\Column(type: 'json', nullable: true)]
    private ?array $colors = null;

    #[ORM\Column(length: 14, nullable: true)]
    private ?string $siret = null;

    /** Rôles stockés en BD — permet ROLE_ADMIN sans entité séparée */
    #[ORM\Column(type: 'json')]
    private array $roles = [];

    #[ORM\Column]
    private \DateTimeImmutable $createdAt;

    #[ORM\OneToMany(targetEntity: Trip::class, mappedBy: 'agency', orphanRemoval: true)]
    private Collection $trips;

    public function __construct()
    {
        $this->trips     = new ArrayCollection();
        $this->createdAt = new \DateTimeImmutable();
        $this->roles     = ['ROLE_AGENCY_ADMIN'];
    }

    public function getId(): ?int { return $this->id; }
    public function getName(): string { return $this->name; }
    public function setName(string $v): static { $this->name = $v; return $this; }
    public function getEmail(): string { return $this->email; }
    public function setEmail(string $v): static { $this->email = $v; return $this; }
    public function getPassword(): string { return $this->password; }
    public function setPassword(string $v): static { $this->password = $v; return $this; }
    public function getPhone(): ?string { return $this->phone; }
    public function setPhone(?string $v): static { $this->phone = $v; return $this; }
    public function getCity(): ?string { return $this->city; }
    public function setCity(?string $v): static { $this->city = $v; return $this; }
    public function getDescription(): ?string { return $this->description; }
    public function setDescription(?string $v): static { $this->description = $v; return $this; }
    public function getStatus(): string { return $this->status; }
    public function setStatus(string $v): static { $this->status = $v; return $this; }
    public function getRating(): ?float { return $this->rating !== null ? (float)$this->rating : null; }
    public function setRating(float|string|null $v): static { $this->rating = $v !== null ? (string)$v : null; return $this; }
    public function getColors(): ?array { return $this->colors; }
    public function setColors(?array $v): static { $this->colors = $v; return $this; }
    public function getSiret(): ?string { return $this->siret; }
    public function setSiret(?string $v): static { $this->siret = $v; return $this; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }
    public function getTrips(): Collection { return $this->trips; }

    // UserInterface
    public function getUserIdentifier(): string { return $this->email; }

    public function getRoles(): array
    {
        $roles = $this->roles;
        $roles[] = 'ROLE_AGENCY_ADMIN'; // toujours présent
        return array_unique($roles);
    }

    public function setRoles(array $roles): static { $this->roles = $roles; return $this; }

    public function isAdmin(): bool { return in_array('ROLE_ADMIN', $this->roles); }

    public function eraseCredentials(): void {}
}
