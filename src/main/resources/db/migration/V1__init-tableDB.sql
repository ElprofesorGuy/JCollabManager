drop table if exists project;
drop table if exists task;
drop table if exists users;

create table project (
    id UUID not null,
    title varchar(50) not null,
    description varchar not null,
    creation_date TIMESTAMP,
    update_date TIMESTAMP,
    primary key (id)
);

create table task(
    id UUID not null,
    title varchar(50) not null,
    description varchar(255) not null,
    /*status varchar not null,*/
    /*assign_to UUID,*/
    creation_date TIMESTAMP,
    project_id UUID,
    primary key (id)
    /*constraint project_id_fk FOREIGN KEY (project_id) references project(id),
    constraint assign_to_fk FOREIGN KEY (assign_to) references users(id)*/
);

create table users(
    id UUID not null,
    username varchar(50) not null,
    role varchar not null,
    email varchar  unique not null,
    date_creation TIMESTAMP,
    password_hash varchar not null,
    primary key (id)
);

/*create table project_members(
    project_id UUID,
    user_id UUID,
    PRIMARY KEY (project_id, user_id),
    constraint pm_project_id_fk FOREIGN KEY (project_id) references project(id),
    constraint pm_user_id_fk FOREIGN KEY (user_id) references users(id)
)*/