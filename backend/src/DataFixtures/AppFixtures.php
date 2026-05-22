<?php

namespace App\DataFixtures;

use App\Entity\Agency;
use App\Entity\Trip;
use App\Entity\User;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class AppFixtures extends Fixture
{
    public function __construct(private readonly UserPasswordHasherInterface $hasher) {}

    public function load(ObjectManager $manager): void
    {
        // ── Agences ───────────────────────────────────────────────────────────

        $agenciesData = [
            ['name' => 'TransExpress',    'email' => 'contact@transexpress.fr',   'city' => 'Paris',     'status' => 'active',  'rating' => 4.8, 'colors' => ['primary' => '#1E3A8A', 'secondary' => '#3B82F6'], 'roles' => ['ROLE_AGENCY_ADMIN']],
            ['name' => 'Riviera Bus',     'email' => 'info@rivierabus.fr',        'city' => 'Marseille', 'status' => 'active',  'rating' => 4.6, 'colors' => ['primary' => '#0369A1', 'secondary' => '#0EA5E9'], 'roles' => ['ROLE_AGENCY_ADMIN']],
            ['name' => 'Atlantic Lines',  'email' => 'contact@atlanticlines.fr',  'city' => 'Bordeaux',  'status' => 'active',  'rating' => 4.5, 'colors' => ['primary' => '#065F46', 'secondary' => '#059669'], 'roles' => ['ROLE_AGENCY_ADMIN']],
            ['name' => 'Alpes Voyages',   'email' => 'bonjour@alpesvoyages.fr',   'city' => 'Grenoble',  'status' => 'pending', 'rating' => 4.3, 'colors' => ['primary' => '#6D28D9', 'secondary' => '#8B5CF6'], 'roles' => ['ROLE_AGENCY_ADMIN']],
            ['name' => 'Super Admin',     'email' => 'admin@busexpress.fr',       'city' => 'Paris',     'status' => 'active',  'rating' => null,'colors' => ['primary' => '#DC2626', 'secondary' => '#EF4444'], 'roles' => ['ROLE_ADMIN', 'ROLE_AGENCY_ADMIN']],
        ];

        $agencies = [];
        foreach ($agenciesData as $d) {
            $a = new Agency();
            $a->setName($d['name'])->setEmail($d['email'])->setCity($d['city'])
              ->setStatus($d['status'])->setRating($d['rating'])->setColors($d['colors'])
              ->setRoles($d['roles'])
              ->setPassword($this->hasher->hashPassword($a, 'password123'));
            $manager->persist($a);
            $agencies[$d['name']] = $a;
        }

        // ── Voyageurs de test ─────────────────────────────────────────────────

        foreach ([
            ['email' => 'jean.dupont@example.fr',   'first' => 'Jean',  'last' => 'Dupont',  'phone' => '06 12 34 56 78'],
            ['email' => 'marie.martin@example.fr',  'first' => 'Marie', 'last' => 'Martin',  'phone' => null],
        ] as $u) {
            $user = new User();
            $user->setEmail($u['email'])->setFirstName($u['first'])->setLastName($u['last'])
                 ->setPhone($u['phone'])->setPassword($this->hasher->hashPassword($user, 'password123'));
            $manager->persist($user);
        }

        // ── 20 voyages pour un défilement bien visible ────────────────────────

        $today    = new \DateTimeImmutable('today');
        $tomorrow = new \DateTimeImmutable('+1 day');
        $dayAfter = new \DateTimeImmutable('+2 days');

        $trips = [
            // Aujourd'hui
            ['agency'=>'TransExpress',   'from'=>'Paris',      'to'=>'Lyon',         'dep'=>'06:30','arr'=>'11:00','dur'=>'4h30', 'price'=>28,  'vip'=>52,  'type'=>'standard',  'quai'=>'Quai 1', 'seats'=>55,'avail'=>28,'status'=>'departed', 'delay'=>0,  'am'=>['wifi','ac'],                   'stops'=>[], 'date'=>$today],
            ['agency'=>'Riviera Bus',    'from'=>'Paris',      'to'=>'Marseille',    'dep'=>'07:15','arr'=>'14:30','dur'=>'7h15', 'price'=>55,  'vip'=>95,  'type'=>'luxury',    'quai'=>'Quai 2', 'seats'=>30,'avail'=>8, 'status'=>'departed', 'delay'=>0,  'am'=>['wifi','ac','usb','coffee'],    'stops'=>['Valence'], 'date'=>$today],
            ['agency'=>'TransExpress',   'from'=>'Paris',      'to'=>'Lyon',         'dep'=>'08:15','arr'=>'12:45','dur'=>'4h30', 'price'=>35,  'vip'=>65,  'type'=>'premium',   'quai'=>'Quai 3', 'seats'=>45,'avail'=>12,'status'=>'boarding', 'delay'=>0,  'am'=>['wifi','ac','usb'],             'stops'=>[], 'date'=>$today],
            ['agency'=>'Riviera Bus',    'from'=>'Paris',      'to'=>'Marseille',    'dep'=>'08:45','arr'=>'16:00','dur'=>'7h15', 'price'=>55,  'vip'=>95,  'type'=>'luxury',    'quai'=>'Quai 1', 'seats'=>30,'avail'=>8, 'status'=>'on_time',  'delay'=>0,  'am'=>['wifi','ac','usb','snacks'],    'stops'=>['Valence'], 'date'=>$today],
            ['agency'=>'Atlantic Lines', 'from'=>'Paris',      'to'=>'Bordeaux',     'dep'=>'09:00','arr'=>'14:45','dur'=>'5h45', 'price'=>42,  'vip'=>null,'type'=>'standard',  'quai'=>'Quai 5', 'seats'=>55,'avail'=>25,'status'=>'delayed',  'delay'=>15, 'am'=>['wifi','ac'],                   'stops'=>['Poitiers'], 'date'=>$today],
            ['agency'=>'TransExpress',   'from'=>'Paris',      'to'=>'Toulouse',     'dep'=>'09:30','arr'=>'15:50','dur'=>'6h20', 'price'=>48,  'vip'=>79,  'type'=>'premium',   'quai'=>'Quai 2', 'seats'=>45,'avail'=>18,'status'=>'on_time',  'delay'=>0,  'am'=>['wifi','ac','usb','coffee'],    'stops'=>[], 'date'=>$today],
            ['agency'=>'Riviera Bus',    'from'=>'Marseille',  'to'=>'Nice',         'dep'=>'10:15','arr'=>'18:45','dur'=>'8h30', 'price'=>75,  'vip'=>120, 'type'=>'couchette', 'quai'=>'Quai 4', 'seats'=>24,'avail'=>6, 'status'=>'on_time',  'delay'=>0,  'am'=>['wifi','ac','snacks','tv'],     'stops'=>['Toulon','Cannes'], 'date'=>$today],
            ['agency'=>'Atlantic Lines', 'from'=>'Bordeaux',   'to'=>'Strasbourg',   'dep'=>'10:45','arr'=>'15:00','dur'=>'4h15', 'price'=>38,  'vip'=>62,  'type'=>'standard',  'quai'=>'Quai 6', 'seats'=>50,'avail'=>22,'status'=>'on_time',  'delay'=>0,  'am'=>['wifi','ac'],                   'stops'=>['Clermont-Ferrand'], 'date'=>$today],
            ['agency'=>'TransExpress',   'from'=>'Paris',      'to'=>'Nantes',       'dep'=>'11:00','arr'=>'15:00','dur'=>'4h00', 'price'=>32,  'vip'=>54,  'type'=>'premium',   'quai'=>'Quai 3', 'seats'=>45,'avail'=>33,'status'=>'on_time',  'delay'=>0,  'am'=>['wifi','ac','usb'],             'stops'=>[], 'date'=>$today],
            ['agency'=>'Riviera Bus',    'from'=>'Lyon',       'to'=>'Paris',        'dep'=>'12:00','arr'=>'16:30','dur'=>'4h30', 'price'=>33,  'vip'=>58,  'type'=>'premium',   'quai'=>'Quai 7', 'seats'=>45,'avail'=>31,'status'=>'delayed',  'delay'=>20, 'am'=>['wifi','ac','usb','coffee'],    'stops'=>[], 'date'=>$today],
            ['agency'=>'Atlantic Lines', 'from'=>'Lyon',       'to'=>'Bordeaux',     'dep'=>'12:30','arr'=>'18:00','dur'=>'5h30', 'price'=>44,  'vip'=>null,'type'=>'standard',  'quai'=>'Quai 8', 'seats'=>55,'avail'=>40,'status'=>'on_time',  'delay'=>0,  'am'=>['wifi','ac'],                   'stops'=>['Clermont-Ferrand'], 'date'=>$today],
            ['agency'=>'TransExpress',   'from'=>'Paris',      'to'=>'Strasbourg',   'dep'=>'13:15','arr'=>'17:45','dur'=>'4h30', 'price'=>41,  'vip'=>72,  'type'=>'premium',   'quai'=>'Quai 2', 'seats'=>45,'avail'=>19,'status'=>'on_time',  'delay'=>0,  'am'=>['wifi','ac','usb'],             'stops'=>[], 'date'=>$today],
            ['agency'=>'Riviera Bus',    'from'=>'Marseille',  'to'=>'Paris',        'dep'=>'14:00','arr'=>'21:30','dur'=>'7h30', 'price'=>58,  'vip'=>98,  'type'=>'luxury',    'quai'=>'Quai 1', 'seats'=>30,'avail'=>14,'status'=>'on_time',  'delay'=>0,  'am'=>['wifi','ac','coffee','snacks'], 'stops'=>['Valence','Lyon'], 'date'=>$today],
            ['agency'=>'Atlantic Lines', 'from'=>'Bordeaux',   'to'=>'Paris',        'dep'=>'14:30','arr'=>'20:15','dur'=>'5h45', 'price'=>43,  'vip'=>null,'type'=>'standard',  'quai'=>'Quai 5', 'seats'=>55,'avail'=>0, 'status'=>'on_time',  'delay'=>0,  'am'=>['wifi','ac'],                   'stops'=>['Poitiers'], 'date'=>$today],
            ['agency'=>'TransExpress',   'from'=>'Paris',      'to'=>'Lyon',         'dep'=>'15:00','arr'=>'19:30','dur'=>'4h30', 'price'=>35,  'vip'=>65,  'type'=>'premium',   'quai'=>'Quai 3', 'seats'=>45,'avail'=>37,'status'=>'on_time',  'delay'=>0,  'am'=>['wifi','ac','usb'],             'stops'=>[], 'date'=>$today],
            ['agency'=>'Riviera Bus',    'from'=>'Paris',      'to'=>'Nice',         'dep'=>'16:00','arr'=>'23:00','dur'=>'7h00', 'price'=>68,  'vip'=>110, 'type'=>'luxury',    'quai'=>'Quai 4', 'seats'=>30,'avail'=>11,'status'=>'on_time',  'delay'=>0,  'am'=>['wifi','ac','usb','coffee','tv'],'stops'=>['Marseille','Cannes'], 'date'=>$today],
            ['agency'=>'Atlantic Lines', 'from'=>'Paris',      'to'=>'Toulouse',     'dep'=>'16:30','arr'=>'22:50','dur'=>'6h20', 'price'=>46,  'vip'=>null,'type'=>'standard',  'quai'=>'Quai 6', 'seats'=>55,'avail'=>28,'status'=>'on_time',  'delay'=>0,  'am'=>['wifi','ac'],                   'stops'=>['Limoges'], 'date'=>$today],
            ['agency'=>'TransExpress',   'from'=>'Paris',      'to'=>'Nantes',       'dep'=>'17:30','arr'=>'21:30','dur'=>'4h00', 'price'=>29,  'vip'=>49,  'type'=>'standard',  'quai'=>'Quai 2', 'seats'=>55,'avail'=>40,'status'=>'on_time',  'delay'=>0,  'am'=>['wifi','ac'],                   'stops'=>[], 'date'=>$today],
            ['agency'=>'Riviera Bus',    'from'=>'Paris',      'to'=>'Marseille',    'dep'=>'21:00','arr'=>'05:30','dur'=>'8h30', 'price'=>72,  'vip'=>115, 'type'=>'couchette', 'quai'=>'Quai 1', 'seats'=>24,'avail'=>18,'status'=>'on_time',  'delay'=>0,  'am'=>['wifi','ac','blanket','tv'],    'stops'=>['Lyon'], 'date'=>$today],
            ['agency'=>'TransExpress',   'from'=>'Paris',      'to'=>'Lyon',         'dep'=>'22:30','arr'=>'06:00','dur'=>'7h30', 'price'=>45,  'vip'=>78,  'type'=>'couchette', 'quai'=>'Quai 3', 'seats'=>24,'avail'=>20,'status'=>'cancelled', 'delay'=>0,  'am'=>['wifi','ac','blanket'],         'stops'=>[], 'date'=>$today],
        ];

        foreach ($trips as $d) {
            $t = new Trip();
            $t->setAgency($agencies[$d['agency']])
              ->setFromCity($d['from'])->setToCity($d['to'])
              ->setDate($d['date'])
              ->setDepartureTime(new \DateTimeImmutable('today ' . $d['dep']))
              ->setArrivalTime(new \DateTimeImmutable('today ' . $d['arr']))
              ->setDuration($d['dur'])
              ->setPrice($d['price'])->setVipPrice($d['vip'])
              ->setType($d['type'])->setPlatform($d['quai'])
              ->setTotalSeats($d['seats'])->setAvailableSeats($d['avail'])
              ->setStatus($d['status'])->setDelayMinutes($d['delay'])
              ->setAmenities($d['am'])->setStops($d['stops'])
              ->setBaggageAllowance(20)->setExtraBaggagePrice(6.0);
            $manager->persist($t);
        }


        // ── Voyages J+1 ──────────────────────────────────────────────────────
        $trips_j1 = [
            ['agency'=>'TransExpress',   'from'=>'Paris',    'to'=>'Lyon',      'dep'=>'08:00','arr'=>'12:30','dur'=>'4h30', 'price'=>32, 'vip'=>60,  'type'=>'premium',  'quai'=>'Quai 1','seats'=>45,'avail'=>35,'status'=>'on_time','delay'=>0,'am'=>['wifi','ac','usb'],'stops'=>[], 'date'=>$tomorrow],
            ['agency'=>'Riviera Bus',    'from'=>'Paris',    'to'=>'Nice',      'dep'=>'09:30','arr'=>'17:00','dur'=>'7h30', 'price'=>68, 'vip'=>110, 'type'=>'luxury',   'quai'=>'Quai 2','seats'=>30,'avail'=>18,'status'=>'on_time','delay'=>0,'am'=>['wifi','ac','coffee','snacks'],'stops'=>['Marseille'],'date'=>$tomorrow],
            ['agency'=>'Atlantic Lines', 'from'=>'Bordeaux', 'to'=>'Paris',     'dep'=>'11:00','arr'=>'16:45','dur'=>'5h45', 'price'=>44, 'vip'=>null,'type'=>'standard', 'quai'=>'Quai 3','seats'=>55,'avail'=>42,'status'=>'on_time','delay'=>0,'am'=>['wifi','ac'],'stops'=>['Poitiers'],'date'=>$tomorrow],
            ['agency'=>'TransExpress',   'from'=>'Paris',    'to'=>'Nantes',    'dep'=>'14:00','arr'=>'18:00','dur'=>'4h00', 'price'=>30, 'vip'=>50,  'type'=>'standard', 'quai'=>'Quai 4','seats'=>55,'avail'=>50,'status'=>'on_time','delay'=>0,'am'=>['wifi','ac'],'stops'=>[],'date'=>$tomorrow],
            ['agency'=>'Riviera Bus',    'from'=>'Lyon',     'to'=>'Marseille', 'dep'=>'16:30','arr'=>'20:00','dur'=>'3h30', 'price'=>38, 'vip'=>65,  'type'=>'premium',  'quai'=>'Quai 5','seats'=>45,'avail'=>29,'status'=>'on_time','delay'=>0,'am'=>['wifi','ac','usb'],'stops'=>[],'date'=>$tomorrow],
        ];

        // ── Voyages J+2 ──────────────────────────────────────────────────────
        $trips_j2 = [
            ['agency'=>'TransExpress',   'from'=>'Paris',    'to'=>'Strasbourg','dep'=>'07:30','arr'=>'12:00','dur'=>'4h30', 'price'=>40, 'vip'=>70,  'type'=>'premium',  'quai'=>'Quai 1','seats'=>45,'avail'=>40,'status'=>'on_time','delay'=>0,'am'=>['wifi','ac','usb'],'stops'=>[],'date'=>$dayAfter],
            ['agency'=>'Atlantic Lines', 'from'=>'Paris',    'to'=>'Bordeaux',  'dep'=>'10:00','arr'=>'15:45','dur'=>'5h45', 'price'=>42, 'vip'=>null,'type'=>'standard', 'quai'=>'Quai 6','seats'=>55,'avail'=>45,'status'=>'on_time','delay'=>0,'am'=>['wifi','ac'],'stops'=>['Poitiers'],'date'=>$dayAfter],
            ['agency'=>'Riviera Bus',    'from'=>'Marseille','to'=>'Paris',     'dep'=>'13:00','arr'=>'20:30','dur'=>'7h30', 'price'=>60, 'vip'=>100, 'type'=>'luxury',   'quai'=>'Quai 2','seats'=>30,'avail'=>20,'status'=>'on_time','delay'=>0,'am'=>['wifi','ac','coffee'],'stops'=>['Lyon'],'date'=>$dayAfter],
            ['agency'=>'TransExpress',   'from'=>'Paris',    'to'=>'Lyon',      'dep'=>'18:00','arr'=>'22:30','dur'=>'4h30', 'price'=>29, 'vip'=>52,  'type'=>'couchette','quai'=>'Quai 3','seats'=>24,'avail'=>16,'status'=>'on_time','delay'=>0,'am'=>['wifi','ac','blanket'],'stops'=>[],'date'=>$dayAfter],
        ];

        foreach (array_merge($trips_j1, $trips_j2) as $d) {
            $t = new Trip();
            $t->setAgency($agencies[$d['agency']])
              ->setFromCity($d['from'])->setToCity($d['to'])
              ->setDate($d['date'])
              ->setDepartureTime(new \DateTimeImmutable('today ' . $d['dep']))
              ->setArrivalTime(new \DateTimeImmutable('today ' . $d['arr']))
              ->setDuration($d['dur'])
              ->setPrice($d['price'])->setVipPrice($d['vip'])
              ->setType($d['type'])->setPlatform($d['quai'])
              ->setTotalSeats($d['seats'])->setAvailableSeats($d['avail'])
              ->setStatus($d['status'])->setDelayMinutes($d['delay'])
              ->setAmenities($d['am'])->setStops($d['stops'])
              ->setBaggageAllowance(20)->setExtraBaggagePrice(6.0);
            $manager->persist($t);
        }

        $manager->flush();
        echo "✅ Fixtures : 5 agences (dont 1 admin), 2 voyageurs, 20 voyages\n";
    }
}
