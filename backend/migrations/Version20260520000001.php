<?php

declare(strict_types=1);

namespace App\Migrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260520000001 extends AbstractMigration
{
    public function getDescription(): string { return 'Initial schema'; }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE agency (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(180) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            phone VARCHAR(20),
            city VARCHAR(255),
            description TEXT,
            status VARCHAR(20) NOT NULL DEFAULT \'pending\',
            rating NUMERIC(3,1),
            colors JSON,
            siret VARCHAR(14),
            created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
        )');

        $this->addSql('CREATE TABLE trip (
            id SERIAL PRIMARY KEY,
            agency_id INT NOT NULL REFERENCES agency(id) ON DELETE CASCADE,
            from_city VARCHAR(100) NOT NULL,
            to_city VARCHAR(100) NOT NULL,
            date DATE NOT NULL,
            departure_time TIME(0) WITHOUT TIME ZONE NOT NULL,
            arrival_time TIME(0) WITHOUT TIME ZONE NOT NULL,
            duration VARCHAR(20) NOT NULL,
            price NUMERIC(8,2) NOT NULL,
            vip_price NUMERIC(8,2),
            type VARCHAR(20) NOT NULL DEFAULT \'standard\',
            platform VARCHAR(50),
            total_seats INT NOT NULL DEFAULT 50,
            available_seats INT NOT NULL DEFAULT 50,
            status VARCHAR(20) NOT NULL DEFAULT \'on_time\',
            delay_minutes INT NOT NULL DEFAULT 0,
            description TEXT,
            amenities JSON NOT NULL DEFAULT \'[]\',
            stops JSON NOT NULL DEFAULT \'[]\',
            baggage_allowance INT NOT NULL DEFAULT 20,
            extra_baggage_price NUMERIC(6,2) NOT NULL DEFAULT 5.00,
            created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP(0) WITHOUT TIME ZONE
        )');

        $this->addSql('CREATE TABLE booking (
            id SERIAL PRIMARY KEY,
            trip_id INT NOT NULL REFERENCES trip(id),
            reference VARCHAR(20) NOT NULL UNIQUE,
            passengers JSON NOT NULL DEFAULT \'[]\',
            seat_class VARCHAR(20) NOT NULL DEFAULT \'standard\',
            extra_bags INT NOT NULL DEFAULT 0,
            total_amount NUMERIC(8,2) NOT NULL,
            status VARCHAR(20) NOT NULL DEFAULT \'confirmed\',
            created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
        )');

        $this->addSql('CREATE TABLE messenger_messages (
            id BIGSERIAL PRIMARY KEY,
            body TEXT NOT NULL,
            headers TEXT NOT NULL,
            queue_name VARCHAR(190) NOT NULL,
            created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
            available_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
            delivered_at TIMESTAMP(0) WITHOUT TIME ZONE,
            CONSTRAINT messenger_messages_queue_name CHECK (queue_name != \'\')
        )');
        $this->addSql('CREATE INDEX IDX_75EA56E0FB7336F0 ON messenger_messages (queue_name)');
        $this->addSql('CREATE INDEX IDX_75EA56E0E3BD61CE ON messenger_messages (available_at)');
        $this->addSql('CREATE INDEX IDX_75EA56E016BA31DB ON messenger_messages (delivered_at)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE booking');
        $this->addSql('DROP TABLE trip');
        $this->addSql('DROP TABLE agency');
        $this->addSql('DROP TABLE messenger_messages');
    }
}
