create table comment (
    id UUID not null,
    text TEXT not null,
    created_at TIMESTAMP not null,
    author_id UUID not null,
    task_id UUID not null,
    primary key (id),
    constraint fk_comment_author foreign key (author_id) references users(id) on delete cascade,
    constraint fk_comment_task foreign key (task_id) references task(id) on delete cascade
);
