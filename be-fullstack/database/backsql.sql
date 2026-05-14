SET statement_timeout = 0;

SET lock_timeout = 0;

SET idle_in_transaction_session_timeout = 0;

SET transaction_timeout = 0;

SET client_encoding = 'UTF8';

SET standard_conforming_strings = on;

SELECT pg_catalog.set_config('search_path', '', false);

SET check_function_bodies = false;

SET xmloption = content;

SET client_min_messages = warning;

SET row_security = off;



--

-- Name: public; Type: SCHEMA; Schema: -; Owner: -

--



-- *not* creating schema, since initdb creates it





--

-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -

--



COMMENT ON SCHEMA public IS '';





--

-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -

--



CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;





--

-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -

--



COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';





--

-- Name: chat_type; Type: TYPE; Schema: public; Owner: -

--



CREATE TYPE public.chat_type AS ENUM (

    'DM',

    'GROUP'

);





--

-- Name: participant_role; Type: TYPE; Schema: public; Owner: -

--



CREATE TYPE public.participant_role AS ENUM (

    'OWNER',

    'ADMIN',

    'MEMBER'

);





SET default_tablespace = '';



SET default_table_access_method = heap;



--

-- Name: conversations; Type: TABLE; Schema: public; Owner: -

--



CREATE TABLE public.conversations (

    conversation_id uuid DEFAULT gen_random_uuid() NOT NULL,

    type public.chat_type DEFAULT 'DM'::public.chat_type NOT NULL,

    name character varying(255),

    owner_id uuid,

    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP

);





--

-- Name: participants; Type: TABLE; Schema: public; Owner: -

--



CREATE TABLE public.participants (

    conversation_id uuid NOT NULL,

    user_id uuid NOT NULL,

    role public.participant_role DEFAULT 'MEMBER'::public.participant_role,

    last_read_message_id uuid,

    joined_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP

);





--

-- Name: user_profiles; Type: TABLE; Schema: public; Owner: -

--



CREATE TABLE public.user_profiles (

    profile_id uuid DEFAULT gen_random_uuid() NOT NULL,

    user_id uuid,

    phone character varying(20),

    location text,

    website text,

    bio text,

    short_description text,

    avatar_url text,

    hobbies jsonb DEFAULT '[]'::jsonb,

    skills jsonb DEFAULT '[]'::jsonb,

    education jsonb DEFAULT '[]'::jsonb,

    privacy character varying(20) DEFAULT 'public'::character varying,

    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,

    full_name character varying(100),

    title character varying(100)

);





--

-- Name: users; Type: TABLE; Schema: public; Owner: -

--



CREATE TABLE public.users (

    user_id uuid DEFAULT gen_random_uuid() NOT NULL,

    username character varying(50) NOT NULL,

    email character varying(255) NOT NULL,

    password_hash character varying(255) NOT NULL,

    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,

    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,

    deleted_at timestamp with time zone

);





--

-- Data for Name: conversations; Type: TABLE DATA; Schema: public; Owner: -

--



COPY public.conversations (conversation_id, type, name, owner_id, created_at) FROM stdin;

\.





--

-- Data for Name: participants; Type: TABLE DATA; Schema: public; Owner: -

--



COPY public.participants (conversation_id, user_id, role, last_read_message_id, joined_at) FROM stdin;

\.





--

-- Data for Name: user_profiles; Type: TABLE DATA; Schema: public; Owner: -

--



COPY public.user_profiles (profile_id, user_id, phone, location, website, bio, short_description, avatar_url, hobbies, skills, education, privacy, updated_at, full_name, title) FROM stdin;

16394c6d-04ea-4948-818e-142c2806a5dd	cd52b030-4e58-4eb7-949b-6bc777bb6b18	0123456789	Ho Chi Minh City, Vietnam	https://portfolio.dev	Passionate developer who loves building scalable applications.	\N	\N	["Reading", "Gaming", "Traveling"]	["React", "Node.js", "Docker"]	[{"year": "2022", "degree": "Bachelor of Computer Science", "university": "HCMUT"}]	public	2026-02-21 05:36:34.407466+00	\N	\N

9f2d005a-053e-4b1a-ab4a-53cb37a2ee82	d6fe603d-6cea-4272-b450-9416cf58b759	0123456789	Ho Chi Minh City, Vietnam	https://portfolio.dev	Passionate developer who loves building scalable applications.	\N	\N	["Reading", "Gaming", "Traveling"]	["React", "Node.js", "Docker"]	[{"year": "2022", "degree": "Bachelor of Computer Science", "university": "HCMUT"}]	public	2026-02-21 05:36:34.407466+00	\N	\N

015f3702-c11c-4ae4-b5f9-a5cb3fb7c01d	6936dc26-3d6a-4ed6-8c5c-6ac5b4cc6575	0123456789	Ho Chi Minh City, Vietnam	https://portfolio.dev	Passionate developer who loves building scalable applications.	\N	\N	["Reading", "Gaming", "Traveling"]	["React", "Node.js", "Docker"]	[{"year": "2022", "degree": "Bachelor of Computer Science", "university": "HCMUT"}]	public	2026-02-21 05:36:34.407466+00	\N	\N

ef6582c6-6030-4610-a99f-0e7bdd065f32	4a7cf371-c88d-4df8-a70c-fe2dbb7ce8de	0123456789	Ho Chi Minh City, Vietnam	https://portfolio.dev	Passionate developer who loves building scalable applications.	\N	\N	["Reading", "Gaming", "Traveling"]	["React", "Node.js", "Docker"]	[{"year": "2022", "degree": "Bachelor of Computer Science", "university": "HCMUT"}]	public	2026-02-21 05:36:34.407466+00	\N	\N

5774857c-d63a-47db-b8b1-5d6b9c6de131	22b81096-69d0-4e48-b002-66ee97c12512	\N	\N	\N	\N	\N	\N	[]	[]	[]	public	2026-03-04 11:38:53.956984+00	\N	\N

078f7209-f6a5-454e-ab73-475c0f42c21e	20d9d3d1-d7aa-4ad0-bd20-8ec3f5a261f4	0123456789	Ho Chi Minh City, Vietnam	https://portfolio.dev	Passionate developer who loves building scalable applications.	\N	\N	["Reading", "Gaming", "Traveling"]	["React", "Node.js", "Docker", "React"]	[{"year": "2022", "degree": "Bachelor of Computer Science", "university": "HCMUT"}, {"year": "", "degree": "", "school": "", "status": ""}, {"year": "", "degree": "", "school": "", "status": ""}, {"year": "", "degree": "", "school": "", "status": ""}, {"year": "", "degree": "", "school": "", "status": ""}]	private	2026-03-15 15:24:13.749662+00	fgfgg	SENIOR JAVA

17f26370-d913-4e5d-b3ee-f4bd6373b268	acb31c83-2f64-4991-aeaf-0bd3071b5b0e	\N	\N	\N	\N	\N	\N	[]	[]	[]	public	2026-03-22 07:55:34.018897+00	mkm	\N

\.





--

-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -

--



COPY public.users (user_id, username, email, password_hash, created_at, updated_at, deleted_at) FROM stdin;

cd52b030-4e58-4eb7-949b-6bc777bb6b18	johndoe	john@example.com	hashed_password_1	2026-02-21 05:36:34.407466+00	2026-02-21 05:36:34.407466+00	\N

d6fe603d-6cea-4272-b450-9416cf58b759	janesmith	jane@example.com	hashed_password_2	2026-02-21 05:36:34.407466+00	2026-02-21 05:36:34.407466+00	\N

6936dc26-3d6a-4ed6-8c5c-6ac5b4cc6575	alexdev	alex@example.com	hashed_password_3	2026-02-21 05:36:34.407466+00	2026-02-21 05:36:34.407466+00	\N

4a7cf371-c88d-4df8-a70c-fe2dbb7ce8de	minhnguyen	minh@example.com	hashed_password_4	2026-02-21 05:36:34.407466+00	2026-02-21 05:36:34.407466+00	\N

20d9d3d1-d7aa-4ad0-bd20-8ec3f5a261f4	Ngominhtam	tam2@example.com	$2b$10$MhRrC7Thq2Qsb396OwTMmuts/BVLsJUIdp865/MCcZ8KVfTWUp1My	2026-02-21 06:45:44.854375+00	2026-02-21 06:45:44.854375+00	\N

22b81096-69d0-4e48-b002-66ee97c12512	yenhi	y@example.com	$2b$10$dvUtpgxlN8vBYBOduB8VPOlGpkzsIMOakTM4y0RpA7DLg4iNto9F2	2026-03-04 11:38:53.956984+00	2026-03-04 11:38:53.956984+00	\N

acb31c83-2f64-4991-aeaf-0bd3071b5b0e	nadl;sjns;kjaf	smndfmsanf@c.com	$2b$10$QQ34fM/ounOeOUky4HTzCe5koC0q9CR.BluU9DwAC88cuTSb.LFbe	2026-03-22 07:46:07.941483+00	2026-03-22 07:46:07.941483+00	\N

\.





--

-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: -

--



ALTER TABLE ONLY public.conversations

    ADD CONSTRAINT conversations_pkey PRIMARY KEY (conversation_id);





--

-- Name: participants participants_pkey; Type: CONSTRAINT; Schema: public; Owner: -

--



ALTER TABLE ONLY public.participants

    ADD CONSTRAINT participants_pkey PRIMARY KEY (conversation_id, user_id);





--

-- Name: user_profiles user_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -

--



ALTER TABLE ONLY public.user_profiles

    ADD CONSTRAINT user_profiles_pkey PRIMARY KEY (profile_id);





--

-- Name: user_profiles user_profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -

--



ALTER TABLE ONLY public.user_profiles

    ADD CONSTRAINT user_profiles_user_id_key UNIQUE (user_id);





--

-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -

--



ALTER TABLE ONLY public.users

    ADD CONSTRAINT users_email_key UNIQUE (email);





--

-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -

--



ALTER TABLE ONLY public.users

    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);





--

-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: -

--



ALTER TABLE ONLY public.users

    ADD CONSTRAINT users_username_key UNIQUE (username);





--

-- Name: idx_participants_user_id; Type: INDEX; Schema: public; Owner: -

--



CREATE INDEX idx_participants_user_id ON public.participants USING btree (user_id);





--

-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: -

--



CREATE INDEX idx_users_email ON public.users USING btree (email);





--

-- Name: idx_users_username; Type: INDEX; Schema: public; Owner: -

--



CREATE INDEX idx_users_username ON public.users USING btree (username);





--

-- Name: conversations conversations_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -

--



ALTER TABLE ONLY public.conversations

    ADD CONSTRAINT conversations_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(user_id) ON DELETE SET NULL;





--

-- Name: participants participants_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -

--



ALTER TABLE ONLY public.participants

    ADD CONSTRAINT participants_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(conversation_id) ON DELETE CASCADE;





--

-- Name: participants participants_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -

--



ALTER TABLE ONLY public.participants

    ADD CONSTRAINT participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;





--

-- Name: user_profiles user_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -

--



ALTER TABLE ONLY public.user_profiles

    ADD CONSTRAINT user_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;





--

-- PostgreSQL database dump complete

--



