-- =============================================================
-- SPUDS — seed data for local development
-- Demo users all share the password: spudspass123
-- Event dates are relative to now() so the feed always looks live.
-- =============================================================

-- ---------- demo auth users ----------
-- The on_auth_user_created trigger creates matching profile rows.
insert into auth.users
  (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
   raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
   confirmation_token, recovery_token, email_change, email_change_token_new)
select
  '00000000-0000-0000-0000-000000000000',
  u.id, 'authenticated', 'authenticated', u.email,
  extensions.crypt('spudspass123', extensions.gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('username', u.username, 'display_name', u.display_name),
  now() - interval '90 days', now(), '', '', '', ''
from (values
  ('a0000000-0000-0000-0000-000000000001'::uuid, 'petey@demo.getspuds.com',  'potato_petey', 'Pete Alvarez'),
  ('a0000000-0000-0000-0000-000000000002'::uuid, 'maria@demo.getspuds.com',  'mario_maria',  'Maria Chen'),
  ('a0000000-0000-0000-0000-000000000003'::uuid, 'rachel@demo.getspuds.com', 'retro_rachel', 'Rachel Kim'),
  ('a0000000-0000-0000-0000-000000000004'::uuid, 'larry@demo.getspuds.com',  'lan_larry',    'Larry Osei'),
  ('a0000000-0000-0000-0000-000000000005'::uuid, 'cass@demo.getspuds.com',   'cozy_cass',    'Cassidy Nguyen'),
  ('a0000000-0000-0000-0000-000000000006'::uuid, 'frank@demo.getspuds.com',  'fps_frank',    'Frank Delgado'),
  ('a0000000-0000-0000-0000-000000000007'::uuid, 'izzy@demo.getspuds.com',   'indie_izzy',   'Izzy Martins'),
  ('a0000000-0000-0000-0000-000000000008'::uuid, 'dana@demo.getspuds.com',   'dpad_dana',    'Dana Whitfield')
) as u (id, email, username, display_name);

insert into auth.identities
  (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select
  id::text, id,
  jsonb_build_object('sub', id::text, 'email', email, 'email_verified', true),
  'email', now(), now(), now()
from auth.users
where email like '%@demo.getspuds.com';

-- ---------- flesh out profiles ----------
update public.profiles p set
  avatar_url = 'https://api.dicebear.com/9.x/adventurer/png?size=160&seed=' || p.username,
  onboarded = true,
  location = v.location, latitude = v.lat, longitude = v.lng, bio = v.bio
from (values
  ('potato_petey', 'Logan Square, Chicago', 41.9230, -87.7099, 'Smash TO and couch-multiplayer evangelist. If there''s a CRT and a GameCube, I''m there.'),
  ('mario_maria',  'Wicker Park, Chicago',  41.9088, -87.6796, 'Mario Kart shortcut scientist. Blue shells are a personality trait.'),
  ('retro_rachel', 'Pilsen, Chicago',       41.8570, -87.6455, 'Collecting SNES carts since before it was cool. I run the retro club.'),
  ('lan_larry',    'West Loop, Chicago',    41.8827, -87.6482, 'LAN party organizer. Yes, I''ll bring the switch. The network switch.'),
  ('cozy_cass',    'Andersonville, Chicago',41.9773, -87.6687, 'Stardew farmer, Animal Crossing decorator, professional vibe curator.'),
  ('fps_frank',    'Lincoln Park, Chicago', 41.9214, -87.6513, 'Tac-shooter grinder trying to touch grass via LAN parties.'),
  ('indie_izzy',   'Hyde Park, Chicago',    41.7943, -87.5907, 'Indie game sommelier. Ask me for a rec and lose your weekend.'),
  ('dpad_dana',    'Uptown, Chicago',       41.9665, -87.6533, 'Fighting game newbie turned lab monster. Learning one combo at a time.')
) as v (username, location, lat, lng, bio)
where p.username = v.username;

-- ---------- gaming profiles ----------
insert into public.gaming_profiles (user_id, favorite_games, platforms, play_styles, availability, goals)
select p.id, v.games, v.platforms, v.styles, v.avail, v.goals
from (values
  ('potato_petey', array['Super Smash Bros. Ultimate','Mario Kart 8 Deluxe','Street Fighter 6'], array['Switch','GameCube'], array['Competitive','Social'], array['Weeknights','Weekends'], array['Host events','Build community']),
  ('mario_maria',  array['Mario Kart 8 Deluxe','Mario Party Superstars','Overcooked 2'], array['Switch'], array['Casual','Social'], array['Weekends'], array['Make friends','Try new games']),
  ('retro_rachel', array['Super Mario World','Chrono Trigger','Street Fighter II'], array['SNES','Genesis','Arcade'], array['Casual','Collector'], array['Weekends'], array['Host events','Build community']),
  ('lan_larry',    array['Rocket League','Valorant','Counter-Strike 2'], array['PC'], array['Competitive','Team player'], array['Weekends','Weeknights'], array['Host events','Find a squad']),
  ('cozy_cass',    array['Stardew Valley','Animal Crossing: New Horizons','Unpacking'], array['Switch','PC'], array['Casual','Cozy'], array['Weeknights'], array['Make friends']),
  ('fps_frank',    array['Valorant','Apex Legends','Halo Infinite'], array['PC','Xbox'], array['Competitive'], array['Weeknights'], array['Find a squad','Improve skills']),
  ('indie_izzy',   array['Hades II','Balatro','Celeste'], array['PC','Switch','Steam Deck'], array['Casual','Explorer'], array['Weekends'], array['Try new games','Make friends']),
  ('dpad_dana',    array['Street Fighter 6','Guilty Gear Strive','Tekken 8'], array['PS5','PC'], array['Learning','Competitive'], array['Weeknights','Weekends'], array['Improve skills','Make friends'])
) as v (username, games, platforms, styles, avail, goals)
join public.profiles p on p.username = v.username;

-- ---------- communities ----------
insert into public.communities (id, creator_id, name, slug, description, image_url, games, location)
values
  ('c0000000-0000-0000-0000-000000000001',
   (select id from public.profiles where username = 'potato_petey'),
   'Windy City Smash', 'windy-city-smash',
   'Chicago''s friendliest Smash Ultimate scene. Weekly locals, monthly bracket nights, zero elitism. New players get a free bye into our hearts.',
   'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=1200&q=80',
   array['Super Smash Bros. Ultimate','Super Smash Bros. Melee'], 'Logan Square, Chicago'),
  ('c0000000-0000-0000-0000-000000000002',
   (select id from public.profiles where username = 'retro_rachel'),
   'Chicago Retro Gamers', 'chicago-retro-gamers',
   'CRTs, cartridges, and couch co-op. We meet monthly to play the classics on original hardware. Bring a cart to swap!',
   'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&q=80',
   array['Super Mario World','Street Fighter II','GoldenEye 007'], 'Pilsen, Chicago'),
  ('c0000000-0000-0000-0000-000000000003',
   (select id from public.profiles where username = 'lan_larry'),
   'Lakeview LAN Club', 'lakeview-lan-club',
   'Bring-your-own-PC LAN parties, the way the internet intended. Gigabit switch provided. Pizza mandatory.',
   'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&q=80',
   array['Rocket League','Valorant','Counter-Strike 2'], 'West Loop, Chicago'),
  ('c0000000-0000-0000-0000-000000000004',
   (select id from public.profiles where username = 'cozy_cass'),
   'Cozy Gamers CHI', 'cozy-gamers-chi',
   'Low-stakes, high-comfort gaming hangs. Farming sims, puzzle games, and hot chocolate. Introverts welcome — parallel play encouraged.',
   'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=1200&q=80',
   array['Stardew Valley','Animal Crossing: New Horizons','Balatro'], 'Andersonville, Chicago');

-- extra members (creators were auto-added as owners by trigger)
insert into public.community_members (community_id, user_id, role)
select c.id, p.id, 'member'
from (values
  ('windy-city-smash', 'dpad_dana'), ('windy-city-smash', 'mario_maria'), ('windy-city-smash', 'frank@x'),
  ('chicago-retro-gamers', 'potato_petey'), ('chicago-retro-gamers', 'indie_izzy'),
  ('lakeview-lan-club', 'fps_frank'), ('lakeview-lan-club', 'dpad_dana'),
  ('cozy-gamers-chi', 'indie_izzy'), ('cozy-gamers-chi', 'mario_maria')
) as v (slug, username)
join public.communities c on c.slug = v.slug
join public.profiles p on p.username = case when v.username = 'frank@x' then 'fps_frank' else v.username end;

-- ---------- events ----------
-- Conversations for each event are auto-created by trigger.
insert into public.events
  (id, host_id, community_id, title, description, image_url, event_type, games, platforms,
   start_time, end_time, location_name, address, latitude, longitude,
   capacity, price, skill_level, equipment, rules, featured, status)
values
  ('e0000000-0000-0000-0000-000000000001',
   (select id from public.profiles where username = 'potato_petey'),
   'c0000000-0000-0000-0000-000000000001',
   'Smash Ultimate Weekly #42',
   'Our flagship weekly! Four setups, friendlies from 6, bracket at 7:30. Loser''s bracket runs full — everyone gets at least 4 games. First-timers: come at 6 and we''ll pair you with a mentor for warmups.',
   'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=1200&q=80',
   'gaming_party', array['Super Smash Bros. Ultimate'], array['Switch'],
   date_trunc('hour', now()) + interval '2 days 18 hours', date_trunc('hour', now()) + interval '2 days 22 hours',
   'Logan Arcade', '2410 W Fullerton Ave, Chicago, IL', 41.9247, -87.6889,
   32, 5.00, 'all', '4 full setups provided. Bring your own GameCube controller if you have one.',
   'Standard ruleset, 3 stock, 7 minutes. Be cool to new players.', true, 'published'),

  ('e0000000-0000-0000-0000-000000000002',
   (select id from public.profiles where username = 'mario_maria'),
   null,
   'Mario Kart & Deep Dish Night',
   'Eight racers, one projector, unlimited pizza. We run a full 48-track gauntlet with rotating seats — winner stays on. Expect yelling. Friendly yelling.',
   'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&q=80',
   'club', array['Mario Kart 8 Deluxe'], array['Switch'],
   date_trunc('hour', now()) + interval '4 days 19 hours', date_trunc('hour', now()) + interval '4 days 23 hours',
   'Maria''s place', 'Wicker Park, Chicago, IL (address shared after RSVP)', 41.9088, -87.6796,
   8, 0, 'all', 'Everything provided — controllers, pizza, and a couch with lumbar support.',
   'House rules: no items off, ever. 150cc. Blue shell grudges expire at midnight.', true, 'published'),

  ('e0000000-0000-0000-0000-000000000003',
   (select id from public.profiles where username = 'retro_rachel'),
   'c0000000-0000-0000-0000-000000000002',
   'SNES Sunday: Retro Couch Classics',
   'Original hardware, CRT glow, and a stack of carts: Super Mario World, Street Fighter II, F-Zero, Chrono Trigger on the side setup. Cart swap table — bring your doubles!',
   'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&q=80',
   'club', array['Super Mario World','Street Fighter II','F-Zero'], array['SNES'],
   date_trunc('hour', now()) + interval '6 days 14 hours', date_trunc('hour', now()) + interval '6 days 18 hours',
   'Pilsen Community Books (back room)', '1102 W 18th St, Chicago, IL', 41.8579, -87.6549,
   16, 0, 'all', 'Two CRT setups + one modded console on the big screen. Carts provided, swaps welcome.',
   null, false, 'published'),

  ('e0000000-0000-0000-0000-000000000004',
   (select id from public.profiles where username = 'lan_larry'),
   'c0000000-0000-0000-0000-000000000003',
   '16-Player LAN: Rocket League + Valorant',
   'BYOPC LAN in a real venue with real bandwidth. Rocket League 3s round-robin in the afternoon, Valorant 10-mans at night. Gigabit switch, power strips, and cold brew provided.',
   'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&q=80',
   'gaming_party', array['Rocket League','Valorant'], array['PC'],
   date_trunc('hour', now()) + interval '9 days 12 hours', date_trunc('hour', now()) + interval '9 days 22 hours',
   'Ignite Gaming Lounge', '3341 N Elston Ave, Chicago, IL', 41.9420, -87.7040,
   16, 15.00, 'intermediate', 'Bring your PC/laptop + peripherals + ethernet cable. Monitors available to rent for $5.',
   'No smurfing. Comms stay friendly. We play for the story, not the rank.', true, 'published'),

  ('e0000000-0000-0000-0000-000000000005',
   (select id from public.profiles where username = 'cozy_cass'),
   'c0000000-0000-0000-0000-000000000004',
   'Cozy Café Hangout: Stardew & Switch',
   'Bring your Switch or Steam Deck to the quiet back room of Kopi Café. We co-op Stardew, visit each other''s islands, and compare Balatro runs. Zero pressure to socialize — parallel play is the point.',
   'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=1200&q=80',
   'club', array['Stardew Valley','Animal Crossing: New Horizons','Balatro'], array['Switch','Steam Deck'],
   date_trunc('hour', now()) + interval '3 days 18 hours', date_trunc('hour', now()) + interval '3 days 21 hours',
   'Kopi Café', '5317 N Clark St, Chicago, IL', 41.9790, -87.6684,
   12, 0, 'all', 'Bring your own handheld. Café asks we each order something.',
   null, false, 'published'),

  ('e0000000-0000-0000-0000-000000000006',
   (select id from public.profiles where username = 'potato_petey'),
   null,
   'Fighting Game Fundamentals (Beginner Night)',
   'Never played a fighting game offline? This is your night. We cover movement, spacing, and your first real combo in SF6 and Smash. Mentors at every setup. The only bad question is a Smash Ball question.',
   'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=1200&q=80',
   'club', array['Street Fighter 6','Super Smash Bros. Ultimate'], array['PS5','Switch'],
   date_trunc('hour', now()) + interval '5 days 18 hours', date_trunc('hour', now()) + interval '5 days 21 hours',
   'Logan Arcade', '2410 W Fullerton Ave, Chicago, IL', 41.9247, -87.6889,
   12, 0, 'beginner', 'All setups and controllers provided, including leverless if you want to try one.',
   'Beginner-only bracket at the end — mentors spectate, no sharks.', false, 'published'),

  ('e0000000-0000-0000-0000-000000000007',
   (select id from public.profiles where username = 'mario_maria'),
   null,
   'Mario Party Chaos: Friendship Stress Test',
   'Two boards, four hours, at least one alliance betrayal. We rotate all attendees through so nobody sits long. Minigame practice lobby on the second TV.',
   'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=1200&q=80',
   'club', array['Mario Party Superstars'], array['Switch'],
   date_trunc('hour', now()) + interval '11 days 19 hours', date_trunc('hour', now()) + interval '11 days 23 hours',
   'The Guild Games Café', '2418 N Milwaukee Ave, Chicago, IL', 41.9268, -87.7010,
   12, 0, 'all', 'Provided. Just bring the capacity for forgiveness.',
   null, false, 'published'),

  ('e0000000-0000-0000-0000-000000000008',
   (select id from public.profiles where username = 'lan_larry'),
   'c0000000-0000-0000-0000-000000000003',
   'Rocket League 2v2 Ladder Night',
   'Casual ladder night — rotate partners every 3 matches so you meet everyone. Great warmup for the big LAN. All ranks welcome, we seed fairly.',
   'https://images.unsplash.com/photo-1560419015-7c427e8ae5ba?w=1200&q=80',
   'club', array['Rocket League'], array['PC'],
   date_trunc('hour', now()) + interval '1 day 19 hours', date_trunc('hour', now()) + interval '1 day 22 hours',
   'Ignite Gaming Lounge', '3341 N Elston Ave, Chicago, IL', 41.9420, -87.7040,
   12, 10.00, 'all', 'Lounge PCs included in price.',
   null, false, 'published'),

  -- A completed event so reviews and history have something to hang on
  ('e0000000-0000-0000-0000-000000000009',
   (select id from public.profiles where username = 'potato_petey'),
   'c0000000-0000-0000-0000-000000000001',
   'Smash Ultimate Weekly #41',
   'Last week''s weekly. 28 entrants, bracket ran clean, dpad_dana got her first tournament win in pools!',
   'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=1200&q=80',
   'gaming_party', array['Super Smash Bros. Ultimate'], array['Switch'],
   now() - interval '5 days', now() - interval '5 days' + interval '4 hours',
   'Logan Arcade', '2410 W Fullerton Ave, Chicago, IL', 41.9247, -87.6889,
   32, 5.00, 'all', null, null, false, 'completed'),

  -- A watch party to showcase the content-first flow
  ('e0000000-0000-0000-0000-000000000010',
   (select id from public.profiles where username = 'fps_frank'),
   null,
   'Worlds Finals Watch Party',
   'The League of Legends Worlds grand final on the big screen. We open two hours early for the pre-show and side bets (bragging rights only). Projector, surround sound, and a taco bar — come loud.',
   'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&q=80',
   'watch_party',
   array['Esports finals', 'League of Legends Worlds', 'Live sports'],
   array[]::text[],
   date_trunc('hour', now()) + interval '7 days 16 hours',
   date_trunc('hour', now()) + interval '7 days 21 hours',
   'The Corner Bar (back room)', '2934 N Sheffield Ave, Chicago, IL', 41.9356, -87.6539,
   40, 0, 'all',
   'Projector + surround provided. Grab a seat early; taco bar opens at kickoff.',
   'Spoiler-free if you''re late. Cheer hard, boo softly.', true, 'published'),

  -- A board game night to showcase the tabletop event type
  ('e0000000-0000-0000-0000-000000000011',
   (select id from public.profiles where username = 'cozy_cass'),
   'c0000000-0000-0000-0000-000000000004',
   'Cozy Board Game Night',
   'Low-key tabletop hangout at the café. We''ll have Catan, Wingspan, and Azul out, plus a teaching table for anyone new to a game. Bring a favorite if you''ve got one — we love learning new ones.',
   'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=1200&q=80',
   'board_game',
   array['Catan', 'Wingspan', 'Azul', 'Codenames'],
   array[]::text[],
   date_trunc('hour', now()) + interval '2 days 18 hours',
   date_trunc('hour', now()) + interval '2 days 22 hours',
   'Kopi Café', '5317 N Clark St, Chicago, IL', 41.9790, -87.6684,
   16, 0, 'all',
   'Big tables and a teaching corner. Café asks each guest order something. BYO games welcome.',
   'Newbies encouraged — someone will teach you. Snacks off the board, please.', false, 'published');

-- ---------- RSVPs (trigger adds attendees to event chats) ----------
insert into public.event_attendees (event_id, user_id, status, message)
select v.event_id::uuid, p.id, 'going', v.msg
from (values
  ('e0000000-0000-0000-0000-000000000001', 'dpad_dana',    'Running it back after last week!!'),
  ('e0000000-0000-0000-0000-000000000001', 'mario_maria',  null),
  ('e0000000-0000-0000-0000-000000000001', 'fps_frank',    'First Smash local, be gentle'),
  ('e0000000-0000-0000-0000-000000000001', 'indie_izzy',   null),
  ('e0000000-0000-0000-0000-000000000002', 'potato_petey', 'I main the blue shell'),
  ('e0000000-0000-0000-0000-000000000002', 'cozy_cass',    null),
  ('e0000000-0000-0000-0000-000000000002', 'indie_izzy',   null),
  ('e0000000-0000-0000-0000-000000000003', 'indie_izzy',   'Bringing my Earthbound cart for show and tell'),
  ('e0000000-0000-0000-0000-000000000003', 'potato_petey', null),
  ('e0000000-0000-0000-0000-000000000004', 'fps_frank',    'Finally, LAN Valorant'),
  ('e0000000-0000-0000-0000-000000000004', 'dpad_dana',    null),
  ('e0000000-0000-0000-0000-000000000005', 'mario_maria',  null),
  ('e0000000-0000-0000-0000-000000000005', 'indie_izzy',   'Balatro corner, assemble'),
  ('e0000000-0000-0000-0000-000000000006', 'dpad_dana',    null),
  ('e0000000-0000-0000-0000-000000000006', 'cozy_cass',    'Trying something new!'),
  ('e0000000-0000-0000-0000-000000000008', 'fps_frank',    null),
  ('e0000000-0000-0000-0000-000000000009', 'dpad_dana',    null),
  ('e0000000-0000-0000-0000-000000000009', 'mario_maria',  null),
  ('e0000000-0000-0000-0000-000000000009', 'fps_frank',    null),
  ('e0000000-0000-0000-0000-000000000010', 'dpad_dana',    'Bringing a jersey'),
  ('e0000000-0000-0000-0000-000000000010', 'lan_larry',    null),
  ('e0000000-0000-0000-0000-000000000010', 'indie_izzy',   'Here for the tacos, staying for the game'),
  ('e0000000-0000-0000-0000-000000000011', 'indie_izzy',   'Teaching Wingspan if anyone wants in'),
  ('e0000000-0000-0000-0000-000000000011', 'mario_maria',  null)
) as v (event_id, username, msg)
join public.profiles p on p.username = v.username;

-- ---------- event chat messages ----------
insert into public.messages (conversation_id, sender_id, content, created_at)
select c.id, p.id, v.content, now() - (v.mins_ago || ' minutes')::interval
from (values
  ('e0000000-0000-0000-0000-000000000001', 'potato_petey', 'Setups confirmed for Thursday — we have 4 full stations plus a warmup dock. Bracket starts 7:30 SHARP this time (looking at nobody in particular).', 2880),
  ('e0000000-0000-0000-0000-000000000001', 'dpad_dana',    'That was one time 😤 also I''m bringing homemade cookies as bracket bribes', 2700),
  ('e0000000-0000-0000-0000-000000000001', 'fps_frank',    'First timer here — do I need my own controller?', 1500),
  ('e0000000-0000-0000-0000-000000000001', 'potato_petey', 'We''ve got spares! But if you get hooked (you will), a GC controller is the classic first purchase.', 1440),
  ('e0000000-0000-0000-0000-000000000002', 'mario_maria',  'Pizza poll: 2 deep dish + 1 thin crust for the wrong-opinion-havers?', 4000),
  ('e0000000-0000-0000-0000-000000000002', 'potato_petey', 'thin crust erasure. rigged like your item settings', 3900),
  ('e0000000-0000-0000-0000-000000000005', 'cozy_cass',    'Reminder the back room opens at 6 — grab a drink up front first. I''ll have my island open for visitors 🏝️', 800),
  ('e0000000-0000-0000-0000-000000000004', 'lan_larry',    'Network config posted. If your PC can''t do ethernet, DM me and I''ll bring a USB adapter.', 5000)
) as v (event_id, username, content, mins_ago)
join public.conversations c on c.event_id = v.event_id::uuid
join public.profiles p on p.username = v.username;

-- ---------- reviews (for the completed weekly) ----------
insert into public.reviews (reviewer_id, reviewed_user_id, event_id, rating, comment, tags)
select r.id, h.id, 'e0000000-0000-0000-0000-000000000009', v.rating, v.comment, v.tags
from (values
  ('dpad_dana',   5, 'Pete runs the tightest bracket in the city and somehow makes losing fun. Got my first pools win and the whole venue cheered.', array['Organized','Beginner friendly','Great setup']),
  ('mario_maria', 5, 'Showed up alone, left with a crew. The mentor pairing for new players is such a good idea.', array['Friendly','Beginner friendly']),
  ('fps_frank',   4, 'Great event, ran a little long but the setups were pristine. Will be back.', array['Great setup','Organized'])
) as v (username, rating, comment, tags)
join public.profiles r on r.username = v.username
cross join (select id from public.profiles where username = 'potato_petey') h;

-- ---------- follows ----------
insert into public.follows (follower_id, following_id)
select f.id, g.id
from (values
  ('dpad_dana', 'potato_petey'), ('mario_maria', 'potato_petey'), ('fps_frank', 'potato_petey'),
  ('potato_petey', 'dpad_dana'), ('indie_izzy', 'cozy_cass'), ('cozy_cass', 'indie_izzy'),
  ('fps_frank', 'lan_larry'), ('dpad_dana', 'mario_maria')
) as v (follower, following)
join public.profiles f on f.username = v.follower
join public.profiles g on g.username = v.following;
