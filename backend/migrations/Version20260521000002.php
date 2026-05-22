<?php

declare(strict_types=1);

namespace App\Migrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260521000002 extends AbstractMigration
{
    public function getDescription(): string { return 'Add roles to agency + create user table'; }

    public function up(Schema $schema): void
    {
        // Ajouter la colonne roles à agency (si elle n'existe pas)
        $this->addSql("ALTER TABLE agency ADD COLUMN IF NOT EXISTS roles JSON NOT NULL DEFAULT '[\"ROLE_AGENCY_ADMIN\"]'");

        // Mettre à jour les agences existantes
        $this->addSql("UPDATE agency SET roles = '[\"ROLE_AGENCY_ADMIN\"]' WHERE roles IS NULL OR roles::text = 'null'");

        // Table user (voyageurs)
        $this->addSql('CREATE TABLE IF NOT EXISTS "user" (
            id SERIAL PRIMARY KEY,
            email VARCHAR(180) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            first_name VARCHAR(100),
            last_name VARCHAR(100),
            phone VARCHAR(20),
            roles JSON NOT NULL DEFAULT \'["ROLE_USER"]\',
            created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
        )');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE agency DROP COLUMN IF EXISTS roles');
        $this->addSql('DROP TABLE IF EXISTS "user"');
    }
}
