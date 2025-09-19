-- Bot-Dimension (bot_key) und Indizes einziehen; rückwärtskompatibel mit DEFAULT 'content'.

ALTER TABLE IF EXISTS group_subscriptions
  ADD COLUMN IF NOT EXISTS bot_key TEXT NOT NULL DEFAULT 'content';
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname='group_subscriptions_bot_chat_uk'
  ) THEN
    CREATE UNIQUE INDEX group_subscriptions_bot_chat_uk
      ON group_subscriptions (bot_key, chat_id);
  END IF;
END $$;

ALTER TABLE IF EXISTS adv_settings
  ADD COLUMN IF NOT EXISTS bot_key TEXT NOT NULL DEFAULT 'content';
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_name='adv_settings' AND constraint_type='PRIMARY KEY'
  ) THEN
    ALTER TABLE adv_settings ADD PRIMARY KEY (bot_key, chat_id);
  END IF;
END $$;

ALTER TABLE IF EXISTS adv_campaigns
  ADD COLUMN IF NOT EXISTS bot_key TEXT NOT NULL DEFAULT 'content';

ALTER TABLE IF EXISTS adv_impressions
  ADD COLUMN IF NOT EXISTS bot_key TEXT NOT NULL DEFAULT 'content';

ALTER TABLE IF EXISTS message_logs
  ADD COLUMN IF NOT EXISTS bot_key TEXT NOT NULL DEFAULT 'content';

ALTER TABLE IF EXISTS payment_orders
  ADD COLUMN IF NOT EXISTS bot_key TEXT NOT NULL DEFAULT 'content';
