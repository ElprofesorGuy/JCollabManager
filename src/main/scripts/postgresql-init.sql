-- 1. Supprimer la base si elle existe
-- Note : En Postgres, on ne peut pas supprimer une base si quelqu'un est connecté dessus.
DROP DATABASE IF EXISTS collaborationDB;

-- 2. Supprimer l'utilisateur s'il existe
DROP USER IF EXISTS postgresadmin;

-- 3. Créer la base de données
-- L'encodage UTF8 est le standard par défaut sur Postgres
CREATE DATABASE collaborationDB;

-- 4. Créer l'utilisateur
CREATE USER postgresadmin WITH PASSWORD 'guyzomaru';

-- 5. -- On donne à l'utilisateur le droit de créer des objets dans le schéma 'public'
GRANT ALL ON SCHEMA public TO postgresadmin;

