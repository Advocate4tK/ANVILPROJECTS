import { createClient } from '@supabase/supabase-js';
const db = createClient('https://kaniccdqieyesezpousu.supabase.co', 'sb_publishable_pJX6Fsg4YrSNEhfNTHbkLA_tzFJmEUb');

// [email, Central Assign ID]  — batch 3: Brooklyn, Woodstock, Canterbury
const PAIRS = [
  // Brooklyn
  ['sullivanbarrette13@gmail.com','40779'],['wolfcheetah123@gmail.com','40531'],['bulmerg86@gmail.com','37810'],
  ['kacbulmer8@gmail.com','39996'],['gabrielsoccer133@gmail.com','38732'],['michaelcovington133@gmail.com','37401'],
  ['lochlan.curran@icloud.com','40249'],['ronan.curran@icloud.com','35246'],['reagansiobhan@hotmail.com','34967'],
  ['tcurran815@gmail.com','38711'],['bro-rich@icloud.com','40559'],['lilahledogar@icloud.com','40565'],
  ['lucieledogar@gmail.com','40564'],
  // Woodstock
  ['carsonjbartels@icloud.com','40523'],['obenedict27@marianapolis.org','39882'],['charsoccer20@icloud.com','36855'],
  ['missycaisse@gmail.com','36750'],['bombboy3656@yahoo.com','39881'],['mbpul@yahoo.com','37431'],
  ['nrdrake8@gmail.com','37500'],['harrisondurand6608@gmail.com','37447'],['jacksondurand409@gmail.com','37415'],
  ['sgembos71@yahoo.com','36307'],['bgraves2027@woodstockacademy.org','39907'],['lgregorzek@gmail.com','39328'],
  ['harrisonmacdonald170@gmail.com','40520'],['collinmanuilow@gmail.com','33853'],['mattyssox@gmail.com','40819'],
  ['dylans0511@outlook.com','40760'],
  // Canterbury
  ['dcoombs900@gmail.com','37259'],['corey.forsyth87@gmail.com','39886'],['milee98@yahoo.com','37490'],
  ['jl704m@gmail.com','37491'],['kasey29tractor@gmail.com','36889'],['davepaq1122@gmail.com','39083'],
  ['jverraneault@yahoo.com','39908'],['apescatello@gmail.com','40668'],['oepescatello@gmail.com','40678'],
  ['sjbf28@gmail.com','5414'],['shawnamsimas@gmail.com','40174'],['aaronspruance@gmail.com','38639'],
  ['stevemiami09@gmail.com','40833'],
];

let ok = 0, miss = 0;
for (const [email, ca] of PAIRS) {
  const { data: ex } = await db.from('referees').select('id').ilike('email', email).limit(1);
  if (!ex || !ex.length) { console.log(`MISS ${email}`); miss++; continue; }
  await db.from('referees').update({ 'Central Assign ID': ca }).eq('id', ex[0].id);
  ok++;
}
console.log(`CA IDs set: ${ok} | not found: ${miss}`);
