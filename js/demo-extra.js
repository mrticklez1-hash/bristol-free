// Sample events, deals and recipes used in demo mode (before Supabase is connected).
const day = (n, h = 10, m = 0) => { const d = new Date(); d.setDate(d.getDate() + n); d.setHours(h, m, 0, 0); return d.toISOString(); };
const date = n => day(n).slice(0, 10);

export const DEMO_EVENTS = [
  { id: "e1", title: "Library Rhyme Time", area: "Central Bristol", venue: "Central Library, College Green", starts_at: day(1, 10, 30), ends_at: day(1, 11), repeat_until: date(60), price_band: 0, ages: ["baby", "toddler"], description: "Songs, rhymes and stories for under-5s with a grown-up. Just turn up." },
  { id: "e2", title: "Junior parkrun", area: "North Bristol", venue: "Blaise Castle Estate", starts_at: day(5, 9), ends_at: day(5, 9, 45), repeat_until: date(90), price_band: 0, ages: ["kids"], description: "Free, timed 2k run for 4 to 14 year olds every Sunday morning. Register once online." },
  { id: "e3", title: "Christmas lantern making", area: "South Bristol", venue: "Windmill Hill City Farm", starts_at: day(3, 13), ends_at: day(3, 15), price_band: 1, price_note: "£3 per lantern", ages: ["kids"], description: "Make a willow and tissue lantern to take home. All materials included." },
  { id: "e4", title: "Messy play stay & play", area: "East Bristol", venue: "St George Community Centre", starts_at: day(2, 9, 30), ends_at: day(2, 11), repeat_until: date(40), price_band: 1, price_note: "£2 per family", ages: ["baby", "toddler"], description: "Paint, playdough, sand and water. Old clothes recommended!" },
  { id: "e5", title: "Family film morning: Paddington", area: "Portishead", venue: "Somerset Hall", starts_at: day(6, 10), ends_at: day(6, 11, 45), price_band: 1, price_note: "£4, under-2s free", ages: ["toddler", "kids"], description: "Relaxed screening with the lights half up. Bring a cushion." },
  { id: "e6", title: "Santa's grotto at the farm", area: "Keynsham", venue: "Avon Valley Adventure", starts_at: day(9, 10), ends_at: day(9, 16), price_band: 3, ages: ["toddler", "kids"], description: "Meet Santa, feed the animals and play on the indoor barn. Booking essential." },
  { id: "e7", title: "Free swim for under-8s", area: "Yate", venue: "Yate Leisure Centre", starts_at: day(4, 14), ends_at: day(4, 15), price_band: 0, ages: ["toddler", "kids"], description: "School holiday free swim session. One adult per two children." },
];

export const DEMO_DEALS = [
  { id: "d1", business_name: "Jumping Jellybeans", area: "East Bristol", badge: "10%", offer: "10% off weekday entry", kind: "percent_item", value: 10, item_price: 12, details: "Monday to Friday, term time. One discount per family per visit.", members_only: true, valid_until: date(60) },
  { id: "d2", business_name: "Little Picassos Art Club", area: "North Bristol", badge: "FREE", offer: "First class free", kind: "fixed", value: 8, details: "Try any Saturday class for free before you book a term.", members_only: true },
  { id: "d3", business_name: "Party Pandas", area: "South Bristol", badge: "£20", offer: "£20 off weekend parties", kind: "fixed", value: 20, details: "Book any Saturday or Sunday party package.", members_only: true, valid_until: date(30) },
  { id: "d4", business_name: "The Toy Barn", area: "Keynsham", badge: "15%", offer: "15% off wooden toys", kind: "percent_bill", value: 15, details: "Excludes sale items. Online code: BRISTOLFREE.", members_only: false },
  { id: "d5", business_name: "Seaside Swim School", area: "Clevedon", badge: "2 FOR 1", offer: "Sibling joins half price", kind: "fixed", value: 27.5, details: "Second child's term at 50% off when siblings join together.", members_only: true },
];

export const DEMO_RECIPES = [
  { id: "r1", slug: "one-pot-tomato-pasta", title: "One-pot tomato pasta", summary: "Everything cooks in one pan, so there's hardly any washing up. Kids can help stir.", serves: 4, prep_mins: 5, cook_mins: 15, cost_per_serving: 0.65, tags: ["Vegetarian", "Under 20 mins"],
    ingredients: ["300g pasta shapes", "1 tin chopped tomatoes", "1 onion, finely chopped", "2 cloves garlic, crushed", "700ml vegetable stock", "Handful of spinach (optional)", "Grated cheese, to serve"],
    method: ["Put everything except the spinach and cheese in a large pan.", "Bring to the boil, then simmer for 12 to 15 minutes, stirring often, until the pasta is cooked and the sauce is thick.", "Stir in the spinach until it wilts.", "Serve with grated cheese on top."] },
  { id: "r2", slug: "sheet-pan-sausage-traybake", title: "Sausage and veg traybake", summary: "Throw it all on one tray and let the oven do the work. Swap in any veg you have.", serves: 4, prep_mins: 10, cook_mins: 35, cost_per_serving: 1.10, tags: ["Freezer friendly"],
    ingredients: ["8 sausages", "3 potatoes, cut into chunks", "2 carrots, sliced", "1 red onion, cut into wedges", "1 tbsp oil", "1 tsp dried mixed herbs"],
    method: ["Heat the oven to 200°C (180°C fan).", "Toss the veg with the oil and herbs on a big baking tray.", "Add the sausages and roast for 35 minutes, turning halfway, until golden."] },
  { id: "r3", slug: "banana-oat-pancakes", title: "Three-ingredient banana pancakes", summary: "No flour or sugar needed. Great for using up brown bananas.", serves: 2, prep_mins: 5, cook_mins: 10, cost_per_serving: 0.35, tags: ["Vegetarian", "Breakfast"],
    ingredients: ["2 ripe bananas", "2 eggs", "60g porridge oats", "A little butter or oil for the pan"],
    method: ["Mash the bananas, then mix in the eggs and oats.", "Heat a little butter in a frying pan over a medium heat.", "Drop in spoonfuls of batter and cook for 2 minutes on each side."] },
];
