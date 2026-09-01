// RHAMBOREE 2026 schedule import
// Usage: node sql/run-rham-import.js

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://kaniccdqieyesezpousu.supabase.co';
const SERVICE_KEY  = 'sb_secret_TSkG7wNpUcgIxnlcCSMD-A_EmMdHKsS';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const games = [
  // â”€â”€ Lions Field, Hebron â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // U8 Girls
  { date:'2026-06-13', time:'08:30', "Home Team":'Lebanon JSA (AA)', "Away Team":'RHAM (BB)',        "Age Group":'U8 Girls',  "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Lions A' },
  { date:'2026-06-13', time:'08:30', "Home Team":'WAM (CC)',         "Away Team":'Lebanon JSA (DD)', "Age Group":'U8 Girls',  "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Lions B' },
  { date:'2026-06-13', time:'08:30', "Home Team":'Coventry (EE)',    "Away Team":'WAM (11)',         "Age Group":'U8 Girls',  "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Lions C' },
  { date:'2026-06-13', time:'08:30', "Home Team":'Lebanon JSA (22)', "Away Team":'Bolton (33)',      "Age Group":'U8 Girls',  "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Lions D' },
  { date:'2026-06-13', time:'09:00', "Home Team":'Lebanon JSA (AA)', "Away Team":'WAM (CC)',         "Age Group":'U8 Girls',  "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Lions A' },
  { date:'2026-06-13', time:'09:00', "Home Team":'WAM (55)',         "Away Team":'Coventry (EE)',    "Age Group":'U8 Girls',  "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Lions B' },
  { date:'2026-06-13', time:'09:00', "Home Team":'WAM (11)',         "Away Team":'Lebanon JSA (22)', "Age Group":'U8 Girls',  "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Lions C' },
  { date:'2026-06-13', time:'09:00', "Home Team":'Bolton (33)',      "Away Team":'Coventry (44)',    "Age Group":'U8 Girls',  "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Lions D' },
  { date:'2026-06-13', time:'09:30', "Home Team":'Coventry (44)',    "Away Team":'Lebanon JSA (DD)', "Age Group":'U8 Girls',  "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Lions A' },
  { date:'2026-06-13', time:'09:30', "Home Team":'Lebanon JSA (AA)', "Away Team":'WAM (11)',         "Age Group":'U8 Girls',  "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Lions B' },
  { date:'2026-06-13', time:'09:30', "Home Team":'RHAM (BB)',        "Away Team":'Lebanon JSA (22)', "Age Group":'U8 Girls',  "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Lions C' },
  { date:'2026-06-13', time:'09:30', "Home Team":'WAM (CC)',         "Away Team":'Coventry (EE)',    "Age Group":'U8 Girls',  "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Lions D' },
  { date:'2026-06-13', time:'10:00', "Home Team":'WAM (55)',         "Away Team":'Bolton (33)',      "Age Group":'U8 Girls',  "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Lions A' },
  { date:'2026-06-13', time:'10:00', "Home Team":'Coventry (44)',    "Away Team":'RHAM (BB)',        "Age Group":'U8 Girls',  "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Lions C' },
  { date:'2026-06-13', time:'10:30', "Home Team":'Lebanon JSA (DD)', "Away Team":'WAM (55)',         "Age Group":'U8 Girls',  "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Lions A' },
  // U8 Boys
  { date:'2026-06-13', time:'10:30', "Home Team":'WAM (E)',          "Away Team":'Lebanon JSA (D)',  "Age Group":'U8 Boys',   "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Lions C' },
  { date:'2026-06-13', time:'11:00', "Home Team":'WAM (A)',          "Away Team":'Coventry (B)',     "Age Group":'U8 Boys',   "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Lions A' },
  { date:'2026-06-13', time:'11:00', "Home Team":'RHAM (C)',         "Away Team":'Lebanon JSA (D)',  "Age Group":'U8 Boys',   "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Lions B' },
  { date:'2026-06-13', time:'11:00', "Home Team":'WAM (E)',          "Away Team":'Lebanon JSA (F)',  "Age Group":'U8 Boys',   "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Lions C' },
  { date:'2026-06-13', time:'11:00', "Home Team":'WAM (G)',          "Away Team":'Lebanon JSA (2)',  "Age Group":'U8 Boys',   "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Lions D' },
  { date:'2026-06-13', time:'11:30', "Home Team":'WAM (A)',          "Away Team":'Bolton (1)',       "Age Group":'U8 Boys',   "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Lions A' },
  { date:'2026-06-13', time:'11:30', "Home Team":'RHAM (C)',         "Away Team":'RHAM (5)',         "Age Group":'U8 Boys',   "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Lions B' },
  { date:'2026-06-13', time:'11:30', "Home Team":'WAM (4)',          "Away Team":'Lebanon JSA (F)',  "Age Group":'U8 Boys',   "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Lions C' },
  { date:'2026-06-13', time:'11:30', "Home Team":'WAM (G)',          "Away Team":'RHAM (3)',         "Age Group":'U8 Boys',   "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Lions D' },
  { date:'2026-06-13', time:'12:30', "Home Team":'WAM (4)',          "Away Team":'Coventry (B)',     "Age Group":'U8 Boys',   "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Lions A' },
  { date:'2026-06-13', time:'12:30', "Home Team":'WAM (A)',          "Away Team":'Lebanon JSA (2)',  "Age Group":'U8 Boys',   "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Lions B' },
  { date:'2026-06-13', time:'12:30', "Home Team":'RHAM (5)',         "Away Team":'Bolton (1)',       "Age Group":'U8 Boys',   "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Lions C' },
  { date:'2026-06-13', time:'12:30', "Home Team":'WAM (E)',          "Away Team":'RHAM (C)',         "Age Group":'U8 Boys',   "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Lions D' },
  { date:'2026-06-13', time:'13:00', "Home Team":'WAM (4)',          "Away Team":'RHAM (5)',         "Age Group":'U8 Boys',   "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Lions A' },
  { date:'2026-06-13', time:'13:00', "Home Team":'RHAM (C)',         "Away Team":'Lebanon JSA (2)',  "Age Group":'U8 Boys',   "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Lions B' },
  { date:'2026-06-13', time:'13:00', "Home Team":'RHAM (3)',         "Away Team":'Lebanon JSA (D)',  "Age Group":'U8 Boys',   "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Lions C' },
  { date:'2026-06-13', time:'13:00', "Home Team":'WAM (6)',          "Away Team":'Lebanon JSA (F)',  "Age Group":'U8 Boys',   "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Lions D' },
  { date:'2026-06-13', time:'13:30', "Home Team":'WAM (G)',          "Away Team":'Coventry (B)',     "Age Group":'U8 Boys',   "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Lions B' },
  { date:'2026-06-13', time:'13:30', "Home Team":'CWSA (7)',         "Away Team":'Lebanon JSA (F)',  "Age Group":'U8 Boys',   "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Lions C' },
  { date:'2026-06-13', time:'13:30', "Home Team":'Bolton (1)',       "Away Team":'RHAM (C)',         "Age Group":'U8 Boys',   "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Lions D' },
  { date:'2026-06-13', time:'14:00', "Home Team":'RHAM (5)',         "Away Team":'Coventry (B)',     "Age Group":'U8 Boys',   "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Lions B' },
  { date:'2026-06-13', time:'14:00', "Home Team":'CWSA (7)',         "Away Team":'RHAM (3)',         "Age Group":'U8 Boys',   "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Lions C' },
  { date:'2026-06-13', time:'14:00', "Home Team":'WAM (6)',          "Away Team":'RHAM (5)',         "Age Group":'U8 Boys',   "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Lions D' },
  { date:'2026-06-13', time:'14:30', "Home Team":'CWSA (7)',         "Away Team":'WAM (6)',          "Age Group":'U8 Boys',   "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Lions C' },
  { date:'2026-06-13', time:'14:30', "Home Team":'RHAM (3)',         "Away Team":'Bolton (1)',       "Age Group":'U8 Boys',   "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Lions D' },
  // U9 Girls comp
  { date:'2026-06-13', time:'15:00', "Home Team":'Coventry (11)',    "Away Team":'RHAM (22)',        "Age Group":'U9 Girls',  "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Lions A' },
  { date:'2026-06-13', time:'15:40', "Home Team":'Coventry (11)',    "Away Team":'RHAM (22)',        "Age Group":'U9 Girls',  "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Lions A' },
  // U10 Girls comp
  { date:'2026-06-13', time:'15:00', "Home Team":'Plainfield (AA)',  "Away Team":'Coventry (BB)',    "Age Group":'U10 Girls', "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Lions B' },
  { date:'2026-06-13', time:'15:40', "Home Team":'Plainfield (AA)',  "Away Team":'WAM (CC)',         "Age Group":'U10 Girls', "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Lions B' },
  { date:'2026-06-13', time:'16:20', "Home Team":'WAM (CC)',         "Away Team":'Coventry (BB)',    "Age Group":'U10 Girls', "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Lions A' },
  { date:'2026-06-13', time:'16:20', "Home Team":'Plainfield (AA)',  "Away Team":'RHAM (22)',        "Age Group":'U10 Girls', "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Lions B' },
  { date:'2026-06-13', time:'17:00', "Home Team":'WAM (CC)',         "Away Team":'Coventry (BB)',    "Age Group":'U10 Girls', "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Lions A' },

  // â”€â”€ Burnt Hill Park, Hebron â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // U12 Girls
  { date:'2026-06-13', time:'08:00', "Home Team":'WAM (A)',          "Away Team":'Bolton (B)',       "Age Group":'U12 Girls', "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Burnt Hill A' },
  { date:'2026-06-13', time:'08:40', "Home Team":'WAM (A)',          "Away Team":'Plainfield (C)',   "Age Group":'U12 Girls', "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Burnt Hill A' },
  { date:'2026-06-13', time:'09:20', "Home Team":'Bolton (B)',       "Away Team":'Plainfield (C)',   "Age Group":'U12 Girls', "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Burnt Hill A' },
  { date:'2026-06-13', time:'10:00', "Home Team":'WAM (A)',          "Away Team":'Plainfield 2 (F)', "Age Group":'U12 Girls', "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Burnt Hill A' },
  { date:'2026-06-13', time:'10:40', "Home Team":'Bolton (B)',       "Away Team":'RHAM (D)',         "Age Group":'U12 Girls', "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Burnt Hill A' },
  { date:'2026-06-13', time:'11:20', "Home Team":'Plainfield (C)',   "Away Team":'Lebanon JSA (E)',  "Age Group":'U12 Girls', "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Burnt Hill A' },
  { date:'2026-06-13', time:'12:00', "Home Team":'RHAM (D)',         "Away Team":'Plainfield 2 (F)', "Age Group":'U12 Girls', "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Burnt Hill A' },
  { date:'2026-06-13', time:'12:40', "Home Team":'RHAM (D)',         "Away Team":'Lebanon JSA (E)',  "Age Group":'U12 Girls', "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Burnt Hill A' },
  { date:'2026-06-13', time:'13:20', "Home Team":'Plainfield 2 (F)', "Away Team":'Lebanon JSA (E)',  "Age Group":'U12 Girls', "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Burnt Hill A' },
  // U10 Girls rec
  { date:'2026-06-13', time:'08:00', "Home Team":'Bolton (1)',       "Away Team":'RHAM (2)',         "Age Group":'U10 Girls', "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Burnt Hill B' },
  { date:'2026-06-13', time:'08:40', "Home Team":'Bolton (1)',       "Away Team":'Lebanon JSA (3)',  "Age Group":'U10 Girls', "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Burnt Hill B' },
  { date:'2026-06-13', time:'09:20', "Home Team":'RHAM (2)',         "Away Team":'Lebanon JSA (3)',  "Age Group":'U10 Girls', "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Burnt Hill B' },
  { date:'2026-06-13', time:'10:00', "Home Team":'Bolton (1)',       "Away Team":'Lebanon JSA 2 (6)',"Age Group":'U10 Girls', "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Burnt Hill B' },
  { date:'2026-06-13', time:'10:40', "Home Team":'RHAM (2)',         "Away Team":'Tolland (4)',      "Age Group":'U10 Girls', "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Burnt Hill B' },
  { date:'2026-06-13', time:'11:20', "Home Team":'Lebanon JSA (3)',  "Away Team":'WAM (5)',          "Age Group":'U10 Girls', "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Burnt Hill B' },
  { date:'2026-06-13', time:'12:00', "Home Team":'Tolland (4)',      "Away Team":'Lebanon JSA 2 (6)',"Age Group":'U10 Girls', "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Burnt Hill B' },
  { date:'2026-06-13', time:'12:40', "Home Team":'Tolland (4)',      "Away Team":'WAM (5)',          "Age Group":'U10 Girls', "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Burnt Hill B' },
  { date:'2026-06-13', time:'13:20', "Home Team":'WAM (5)',          "Away Team":'Lebanon JSA 2 (6)',"Age Group":'U10 Girls', "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Burnt Hill B' },
  // U10 Boys comp
  { date:'2026-06-13', time:'14:00', "Home Team":'Coventry (AA)',    "Away Team":'Bolton (CC)',      "Age Group":'U10 Boys',  "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Burnt Hill A' },
  { date:'2026-06-13', time:'14:40', "Home Team":'RHAM (BB)',        "Away Team":'Coventry (AA)',    "Age Group":'U10 Boys',  "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Burnt Hill A' },
  { date:'2026-06-13', time:'15:20', "Home Team":'Bolton (CC)',      "Away Team":'RHAM (BB)',        "Age Group":'U10 Boys',  "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Burnt Hill A' },
  { date:'2026-06-13', time:'16:00', "Home Team":'Bolton (CC)',      "Away Team":'Coventry (AA)',    "Age Group":'U10 Boys',  "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Burnt Hill A' },
  { date:'2026-06-13', time:'16:40', "Home Team":'RHAM (BB)',        "Away Team":'Coventry (AA)',    "Age Group":'U10 Boys',  "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Burnt Hill A' },

  // â”€â”€ Blackledge Field, Marlborough â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // U10 Boys rec
  { date:'2026-06-13', time:'08:00', "Home Team":'WAM (A)',          "Away Team":'Lebanon JSA (B)',  "Age Group":'U10 Boys',  "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Blackledge A' },
  { date:'2026-06-13', time:'08:00', "Home Team":'Bolton (1)',       "Away Team":'RHAM 2 (2)',       "Age Group":'U10 Boys',  "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Blackledge B' },
  { date:'2026-06-13', time:'08:40', "Home Team":'WAM (A)',          "Away Team":'RHAM (C)',         "Age Group":'U10 Boys',  "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Blackledge A' },
  { date:'2026-06-13', time:'08:40', "Home Team":'Bolton (1)',       "Away Team":'Ellington 2 (3)',  "Age Group":'U10 Boys',  "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Blackledge B' },
  { date:'2026-06-13', time:'09:20', "Home Team":'Lebanon JSA (B)',  "Away Team":'RHAM (C)',         "Age Group":'U10 Boys',  "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Blackledge A' },
  { date:'2026-06-13', time:'09:20', "Home Team":'RHAM 2 (2)',       "Away Team":'Ellington 2 (3)',  "Age Group":'U10 Boys',  "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Blackledge B' },
  { date:'2026-06-13', time:'10:00', "Home Team":'WAM (A)',          "Away Team":'Lebanon JSA 2 (F)',"Age Group":'U10 Boys',  "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Blackledge A' },
  { date:'2026-06-13', time:'10:00', "Home Team":'RHAM 2 (2)',       "Away Team":'Stafford (4)',     "Age Group":'U10 Boys',  "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Blackledge B' },
  { date:'2026-06-13', time:'10:40', "Home Team":'Lebanon JSA (B)',  "Away Team":'Ellington (D)',    "Age Group":'U10 Boys',  "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Blackledge A' },
  { date:'2026-06-13', time:'10:40', "Home Team":'Bolton (1)',       "Away Team":'Tolland 2 (6)',    "Age Group":'U10 Boys',  "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Blackledge B' },
  { date:'2026-06-13', time:'11:20', "Home Team":'RHAM (C)',         "Away Team":'Tolland (E)',      "Age Group":'U10 Boys',  "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Blackledge A' },
  { date:'2026-06-13', time:'11:20', "Home Team":'Ellington 2 (3)',  "Away Team":'CWSA 2 (7)',       "Age Group":'U10 Boys',  "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Blackledge B' },
  { date:'2026-06-13', time:'12:00', "Home Team":'Ellington (D)',    "Away Team":'Lebanon JSA 2 (F)',"Age Group":'U10 Boys',  "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Blackledge A' },
  { date:'2026-06-13', time:'12:00', "Home Team":'Stafford (4)',     "Away Team":'Tolland 2 (6)',    "Age Group":'U10 Boys',  "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Blackledge B' },
  { date:'2026-06-13', time:'12:40', "Home Team":'RHAM (C)',         "Away Team":'CWSA (G)',         "Age Group":'U10 Boys',  "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Blackledge A' },
  { date:'2026-06-13', time:'12:40', "Home Team":'Tolland (E)',      "Away Team":'Lebanon JSA 3 (5)',"Age Group":'U10 Boys',  "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Blackledge B' },
  { date:'2026-06-13', time:'13:20', "Home Team":'Lebanon JSA 2 (F)',"Away Team":'Tolland (E)',      "Age Group":'U10 Boys',  "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Blackledge A' },
  { date:'2026-06-13', time:'13:20', "Home Team":'CWSA (G)',         "Away Team":'Ellington (D)',    "Age Group":'U10 Boys',  "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Blackledge B' },
  { date:'2026-06-13', time:'14:00', "Home Team":'CWSA 2 (7)',       "Away Team":'Tolland 2 (6)',    "Age Group":'U10 Boys',  "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Blackledge A' },
  { date:'2026-06-13', time:'14:00', "Home Team":'Lebanon JSA 3 (5)',"Away Team":'Stafford (4)',     "Age Group":'U10 Boys',  "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Blackledge B' },
  { date:'2026-06-13', time:'14:40', "Home Team":'CWSA 2 (7)',       "Away Team":'Lebanon JSA 3 (5)',"Age Group":'U10 Boys',  "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Blackledge A' },
  { date:'2026-06-13', time:'14:40', "Home Team":'CWSA (G)',         "Away Team":'Tolland 2 (6)',    "Age Group":'U10 Boys',  "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Blackledge B' },
  // U9 Boys comp
  { date:'2026-06-13', time:'15:20', "Home Team":'RHAM (44)',        "Away Team":'WAM (22)',         "Age Group":'U9 Boys',   "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Blackledge A' },
  { date:'2026-06-13', time:'16:00', "Home Team":'Stafford (33)',    "Away Team":'NECONN (11)',      "Age Group":'U9 Boys',   "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Blackledge A' },
  { date:'2026-06-13', time:'16:40', "Home Team":'NECONN (11)',      "Away Team":'WAM (22)',         "Age Group":'U9 Boys',   "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Blackledge A' },
  { date:'2026-06-13', time:'16:40', "Home Team":'Stafford (33)',    "Away Team":'RHAM (44)',        "Age Group":'U9 Boys',   "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Blackledge B' },
  { date:'2026-06-13', time:'17:20', "Home Team":'WAM (22)',         "Away Team":'Stafford (33)',    "Age Group":'U9 Boys',   "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Blackledge A' },
  { date:'2026-06-13', time:'17:20', "Home Team":'NECONN (11)',      "Away Team":'RHAM (44)',        "Age Group":'U9 Boys',   "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Blackledge B' },

  // â”€â”€ Farley Field, Marlborough â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // U12 Boys rec
  { date:'2026-06-13', time:'08:00', "Home Team":'Bolton (A)',       "Away Team":'WAM (B)',          "Age Group":'U12 Boys',  "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Farley A' },
  { date:'2026-06-13', time:'08:00', "Home Team":'Coventry (1)',     "Away Team":'Stafford 2 (2)',   "Age Group":'U12 Boys',  "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Farley B' },
  { date:'2026-06-13', time:'08:40', "Home Team":'WAM (B)',          "Away Team":'Ellington (C)',    "Age Group":'U12 Boys',  "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Farley A' },
  { date:'2026-06-13', time:'08:40', "Home Team":'Coventry 2 (5)',   "Away Team":'Tolland (4)',      "Age Group":'U12 Boys',  "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Farley B' },
  { date:'2026-06-13', time:'09:20', "Home Team":'WAM (B)',          "Away Team":'Stafford (E)',     "Age Group":'U12 Boys',  "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Farley A' },
  { date:'2026-06-13', time:'09:20', "Home Team":'Coventry (1)',     "Away Team":'RHAM 2 (3)',       "Age Group":'U12 Boys',  "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Farley B' },
  { date:'2026-06-13', time:'10:00', "Home Team":'Bolton (A)',       "Away Team":'Ellington (C)',    "Age Group":'U12 Boys',  "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Farley A' },
  { date:'2026-06-13', time:'10:00', "Home Team":'Stafford 2 (2)',   "Away Team":'Coventry 2 (5)',   "Age Group":'U12 Boys',  "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Farley B' },
  { date:'2026-06-13', time:'10:40', "Home Team":'Bolton (A)',       "Away Team":'RHAM (D)',         "Age Group":'U12 Boys',  "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Farley A' },
  { date:'2026-06-13', time:'10:40', "Home Team":'Stafford 2 (2)',   "Away Team":'RHAM 2 (3)',       "Age Group":'U12 Boys',  "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Farley B' },
  { date:'2026-06-13', time:'11:20', "Home Team":'Ellington (C)',    "Away Team":'Stafford (E)',     "Age Group":'U12 Boys',  "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Farley A' },
  { date:'2026-06-13', time:'11:20', "Home Team":'Coventry (1)',     "Away Team":'Tolland (4)',      "Age Group":'U12 Boys',  "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Farley B' },
  { date:'2026-06-13', time:'12:00', "Home Team":'Stafford (E)',     "Away Team":'RHAM (D)',         "Age Group":'U12 Boys',  "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Farley A' },
  { date:'2026-06-13', time:'12:00', "Home Team":'Tolland (4)',      "Away Team":'RHAM 2 (3)',       "Age Group":'U12 Boys',  "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Farley B' },
  { date:'2026-06-13', time:'12:40', "Home Team":'Ellington (C)',    "Away Team":'RHAM (D)',         "Age Group":'U12 Boys',  "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Farley A' },
  { date:'2026-06-13', time:'12:40', "Home Team":'Coventry 2 (5)',   "Away Team":'RHAM 2 (3)',       "Age Group":'U12 Boys',  "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Farley B' },
  // U15 Boys
  { date:'2026-06-13', time:'13:20', "Home Team":'Ellington (AA)',   "Away Team":'RHAM (BB)',        "Age Group":'U15 Boys',  "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Farley B' },
  { date:'2026-06-13', time:'14:00', "Home Team":'Ellington (AA)',   "Away Team":'Coventry (CC)',    "Age Group":'U15 Boys',  "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Farley B' },
  { date:'2026-06-13', time:'14:40', "Home Team":'RHAM (BB)',        "Away Team":'Coventry (CC)',    "Age Group":'U15 Boys',  "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Farley A' },
  { date:'2026-06-13', time:'15:20', "Home Team":'Ellington (AA)',   "Away Team":'RHAM (BB)',        "Age Group":'U15 Boys',  "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Farley A' },
  { date:'2026-06-13', time:'16:00', "Home Team":'Coventry (CC)',    "Away Team":'RHAM (BB)',        "Age Group":'U15 Boys',  "Source Club":'RHAMBOREE', game_type:'Tournament', field:'Farley A' },
];

async function run() {
  console.log(`Inserting ${games.length} RHAMBOREE games into tournament_games...`);

  // Check first row columns to confirm schema
  const { data: sample, error: sErr } = await supabase
    .from('tournament_games')
    .select('"Home Team", "Away Team", "Age Group", "Source Club"')
    .eq('Source Club', 'RHAMBOREE')
    .limit(1);

  if (sErr && sErr.message.includes('column')) {
    console.error('Column check error:', sErr.message);
    console.log('Aborting â€” verify column names in tournament_games');
    process.exit(1);
  }

  // Get current max ID so we can assign explicit IDs (sequence not wired as DEFAULT)
  const { data: maxRow } = await supabase
    .from('tournament_games')
    .select('id')
    .order('id', { ascending: false })
    .limit(1);
  let nextId = (maxRow?.[0]?.id || 0) + 1;
  const gamesWithIds = games.map(g => ({ ...g, id: nextId++ }));

  // Insert in batches of 50
  const BATCH = 50;
  let inserted = 0;
  for (let i = 0; i < gamesWithIds.length; i += BATCH) {
    const batch = gamesWithIds.slice(i, i + BATCH);
    const { data, error } = await supabase
      .from('tournament_games')
      .insert(batch, { defaultToNull: false })
      .select('id');

    if (error) {
      console.error(`Batch ${Math.floor(i/BATCH)+1} error:`, error.message);
      console.error('Details:', JSON.stringify(error, null, 2));
      process.exit(1);
    }
    inserted += data.length;
    console.log(`  Batch ${Math.floor(i/BATCH)+1}: inserted ${data.length} rows (total ${inserted})`);
  }

  console.log(`\nDone. ${inserted} RHAMBOREE games in tournament_games.`);

  // Quick verify
  const { data: verify } = await supabase
    .from('tournament_games')
    .select('"Age Group"')
    .eq('Source Club', 'RHAMBOREE');

  if (verify) {
    const counts = {};
    verify.forEach(r => { counts[r['Age Group']] = (counts[r['Age Group']] || 0) + 1; });
    console.log('\nVerification:');
    Object.entries(counts).sort().forEach(([age, n]) => console.log(`  ${age}: ${n}`));
  }
}

run().catch(err => { console.error(err); process.exit(1); });

