import { Client } from "pg";
import { buildDatabaseUrl } from "../src/index.js";

/**
 * Idempotently installs PostgreSQL pg_trgm + unaccent extensions,
 * creates the immutable `public.iris_normalize_search(text)` function,
 * and ensures GIN trigram indexes exist on searchable Borealis catalog columns.
 */
async function main() {
  const connectionString = buildDatabaseUrl();
  const client = new Client({ connectionString });
  await client.connect();

  try {
    console.info("[db:setup-search] Enabling pg_trgm and unaccent extensions...");
    await client.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm;`);
    await client.query(`CREATE EXTENSION IF NOT EXISTS unaccent;`);
    await client.query(`
      DO $$
      BEGIN
        EXECUTE format(
          'ALTER DATABASE %I SET pg_trgm.word_similarity_threshold = 0.35',
          current_database()
        );
      EXCEPTION WHEN insufficient_privilege THEN
        RAISE NOTICE 'Skipping ALTER DATABASE pg_trgm.word_similarity_threshold (insufficient_privilege)';
      END $$;
    `);

    console.info("[db:setup-search] Creating public.iris_normalize_search(text)...");
    await client.query(`
      CREATE OR REPLACE FUNCTION public.iris_normalize_search(input text)
      RETURNS text
      LANGUAGE sql
      IMMUTABLE
      PARALLEL SAFE
      AS $$
        SELECT trim(
          regexp_replace(
            regexp_replace(
              regexp_replace(
                lower(public.unaccent(coalesce(input, ''))),
                '[''’"\`]+', '', 'g'
              ),
              '[[:punct:]]+', ' ', 'g'
            ),
            '\\s+', ' ', 'g'
          )
        );
      $$;
    `);

    const indexStatements: Array<{ name: string; sql: string }> = [
      // Anime
      {
        name: "idx_anime_title_primary_trgm",
        sql: `CREATE INDEX IF NOT EXISTS idx_anime_title_primary_trgm ON "Anime" USING gin (public.iris_normalize_search("titlePrimary") gin_trgm_ops);`,
      },
      {
        name: "idx_anime_title_secondary_trgm",
        sql: `CREATE INDEX IF NOT EXISTS idx_anime_title_secondary_trgm ON "Anime" USING gin (public.iris_normalize_search("titleSecondary") gin_trgm_ops);`,
      },
      {
        name: "idx_anime_title_native_trgm",
        sql: `CREATE INDEX IF NOT EXISTS idx_anime_title_native_trgm ON "Anime" USING gin (public.iris_normalize_search("titleNative") gin_trgm_ops);`,
      },
      // Manga
      {
        name: "idx_manga_title_primary_trgm",
        sql: `CREATE INDEX IF NOT EXISTS idx_manga_title_primary_trgm ON "Manga" USING gin (public.iris_normalize_search("titlePrimary") gin_trgm_ops);`,
      },
      {
        name: "idx_manga_title_secondary_trgm",
        sql: `CREATE INDEX IF NOT EXISTS idx_manga_title_secondary_trgm ON "Manga" USING gin (public.iris_normalize_search("titleSecondary") gin_trgm_ops);`,
      },
      {
        name: "idx_manga_title_native_trgm",
        sql: `CREATE INDEX IF NOT EXISTS idx_manga_title_native_trgm ON "Manga" USING gin (public.iris_normalize_search("titleNative") gin_trgm_ops);`,
      },
      // Movie
      {
        name: "idx_movie_title_primary_trgm",
        sql: `CREATE INDEX IF NOT EXISTS idx_movie_title_primary_trgm ON "Movie" USING gin (public.iris_normalize_search("titlePrimary") gin_trgm_ops);`,
      },
      {
        name: "idx_movie_title_secondary_trgm",
        sql: `CREATE INDEX IF NOT EXISTS idx_movie_title_secondary_trgm ON "Movie" USING gin (public.iris_normalize_search("titleSecondary") gin_trgm_ops);`,
      },
      {
        name: "idx_movie_title_native_trgm",
        sql: `CREATE INDEX IF NOT EXISTS idx_movie_title_native_trgm ON "Movie" USING gin (public.iris_normalize_search("titleNative") gin_trgm_ops);`,
      },
      // Tv
      {
        name: "idx_tv_title_primary_trgm",
        sql: `CREATE INDEX IF NOT EXISTS idx_tv_title_primary_trgm ON "Tv" USING gin (public.iris_normalize_search("titlePrimary") gin_trgm_ops);`,
      },
      {
        name: "idx_tv_title_secondary_trgm",
        sql: `CREATE INDEX IF NOT EXISTS idx_tv_title_secondary_trgm ON "Tv" USING gin (public.iris_normalize_search("titleSecondary") gin_trgm_ops);`,
      },
      {
        name: "idx_tv_title_native_trgm",
        sql: `CREATE INDEX IF NOT EXISTS idx_tv_title_native_trgm ON "Tv" USING gin (public.iris_normalize_search("titleNative") gin_trgm_ops);`,
      },
      // Game
      {
        name: "idx_game_title_primary_trgm",
        sql: `CREATE INDEX IF NOT EXISTS idx_game_title_primary_trgm ON "Game" USING gin (public.iris_normalize_search("titlePrimary") gin_trgm_ops);`,
      },
      {
        name: "idx_game_title_secondary_trgm",
        sql: `CREATE INDEX IF NOT EXISTS idx_game_title_secondary_trgm ON "Game" USING gin (public.iris_normalize_search("titleSecondary") gin_trgm_ops);`,
      },
      {
        name: "idx_game_title_native_trgm",
        sql: `CREATE INDEX IF NOT EXISTS idx_game_title_native_trgm ON "Game" USING gin (public.iris_normalize_search("titleNative") gin_trgm_ops);`,
      },
      // Book
      {
        name: "idx_book_title_primary_trgm",
        sql: `CREATE INDEX IF NOT EXISTS idx_book_title_primary_trgm ON "Book" USING gin (public.iris_normalize_search("titlePrimary") gin_trgm_ops);`,
      },
      {
        name: "idx_book_title_secondary_trgm",
        sql: `CREATE INDEX IF NOT EXISTS idx_book_title_secondary_trgm ON "Book" USING gin (public.iris_normalize_search("titleSecondary") gin_trgm_ops);`,
      },
      // Music
      {
        name: "idx_music_title_primary_trgm",
        sql: `CREATE INDEX IF NOT EXISTS idx_music_title_primary_trgm ON "Music" USING gin (public.iris_normalize_search("titlePrimary") gin_trgm_ops);`,
      },
      {
        name: "idx_music_title_secondary_trgm",
        sql: `CREATE INDEX IF NOT EXISTS idx_music_title_secondary_trgm ON "Music" USING gin (public.iris_normalize_search("titleSecondary") gin_trgm_ops);`,
      },
      {
        name: "idx_music_artist_name_trgm",
        sql: `CREATE INDEX IF NOT EXISTS idx_music_artist_name_trgm ON "Music" USING gin (public.iris_normalize_search("artistName") gin_trgm_ops);`,
      },
      // Character
      {
        name: "idx_character_name_primary_trgm",
        sql: `CREATE INDEX IF NOT EXISTS idx_character_name_primary_trgm ON "Character" USING gin (public.iris_normalize_search("namePrimary") gin_trgm_ops);`,
      },
      {
        name: "idx_character_name_native_trgm",
        sql: `CREATE INDEX IF NOT EXISTS idx_character_name_native_trgm ON "Character" USING gin (public.iris_normalize_search("nameNative") gin_trgm_ops);`,
      },
      // Person
      {
        name: "idx_person_name_primary_trgm",
        sql: `CREATE INDEX IF NOT EXISTS idx_person_name_primary_trgm ON "Person" USING gin (public.iris_normalize_search("namePrimary") gin_trgm_ops);`,
      },
      {
        name: "idx_person_name_native_trgm",
        sql: `CREATE INDEX IF NOT EXISTS idx_person_name_native_trgm ON "Person" USING gin (public.iris_normalize_search("nameNative") gin_trgm_ops);`,
      },
      // Studio
      {
        name: "idx_studio_name_trgm",
        sql: `CREATE INDEX IF NOT EXISTS idx_studio_name_trgm ON "Studio" USING gin (public.iris_normalize_search("name") gin_trgm_ops);`,
      },
      // Other
      {
        name: "idx_other_title_primary_trgm",
        sql: `CREATE INDEX IF NOT EXISTS idx_other_title_primary_trgm ON "Other" USING gin (public.iris_normalize_search("titlePrimary") gin_trgm_ops);`,
      },
      {
        name: "idx_other_title_secondary_trgm",
        sql: `CREATE INDEX IF NOT EXISTS idx_other_title_secondary_trgm ON "Other" USING gin (public.iris_normalize_search("titleSecondary") gin_trgm_ops);`,
      },
    ];

    console.info(
      `[db:setup-search] Ensuring ${indexStatements.length} GIN trigram indexes...`
    );
    for (const stmt of indexStatements) {
      await client.query(stmt.sql);
    }

    console.info("[db:setup-search] Search extensions and GIN indexes ready.");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("[db:setup-search] Failed:", err);
  process.exit(1);
});
