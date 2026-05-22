<?php

namespace App\Repository;

use App\Entity\Trip;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class TripRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Trip::class);
    }

    public function search(array $filters): array
    {
        $qb = $this->createQueryBuilder('t')
            ->join('t.agency', 'a')
            ->where('a.status = :active')
            ->setParameter('active', 'active');

        if (!empty($filters['fromCity'])) {
            $qb->andWhere('LOWER(t.fromCity) LIKE :from')
               ->setParameter('from', '%' . strtolower($filters['fromCity']) . '%');
        }
        if (!empty($filters['toCity'])) {
            $qb->andWhere('LOWER(t.toCity) LIKE :to')
               ->setParameter('to', '%' . strtolower($filters['toCity']) . '%');
        }
        if (!empty($filters['date'])) {
            $qb->andWhere('t.date = :date')
               ->setParameter('date', new \DateTimeImmutable($filters['date']));
        }
        if (!empty($filters['type'])) {
            $qb->andWhere('t.type = :type')
               ->setParameter('type', $filters['type']);
        }
        if (!empty($filters['agencyId'])) {
            $qb->andWhere('a.id = :agencyId')
               ->setParameter('agencyId', $filters['agencyId']);
        }
        if (isset($filters['minPrice'])) {
            $qb->andWhere('t.price >= :minPrice')
               ->setParameter('minPrice', $filters['minPrice']);
        }
        if (isset($filters['maxPrice'])) {
            $qb->andWhere('t.price <= :maxPrice')
               ->setParameter('maxPrice', $filters['maxPrice']);
        }

        $sort = $filters['sortBy'] ?? 'departureTime';
        $qb->orderBy('t.' . $sort, 'ASC');

        return $qb->getQuery()->getResult();
    }
}
