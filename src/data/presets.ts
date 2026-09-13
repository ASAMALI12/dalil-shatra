export interface ThemePreset {
  id: string;
  name: string;
  theme: string;
  emoji: string;
  childName: string;
  ageGroup: 'toddler' | 'preschool' | 'elementary';
  description: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'space-dinosaurs',
    name: 'Space Dinosaurs',
    theme: 'Space Dinosaurs & Cosmic Rockets',
    emoji: '🚀🦕',
    childName: 'Leo',
    ageGroup: 'preschool',
    description: 'Friendly T-Rex astronauts, stegosaurus flying saucer, and crater picnics with moon cheese.',
  },
  {
    id: 'underwater-unicorns',
    name: 'Underwater Unicorns',
    theme: 'Magical Underwater Unicorns & Mermaids',
    emoji: '🦄🌊',
    childName: 'Maya',
    ageGroup: 'preschool',
    description: 'Pearlescent sea unicorns, bubble castles, dolphin tea parties, and coral gardens.',
  },
  {
    id: 'safari-superheroes',
    name: 'Safari Superheroes',
    theme: 'Safari Animals with Superhero Capes',
    emoji: '🦁⚡',
    childName: 'Noah',
    ageGroup: 'elementary',
    description: 'Flying lion heroes, super-speed cheetahs, and elephant firefighters saving the jungle.',
  },
  {
    id: 'enchanted-bakery',
    name: 'Enchanted Forest Bakery',
    theme: 'Forest Animals Running a Sweet Bakery',
    emoji: '🦊🧁',
    childName: 'Emma',
    ageGroup: 'toddler',
    description: 'Baking giant cupcakes with friendly bears, bunny pastry chefs, and strawberry frosting rivers.',
  },
  {
    id: 'robot-farms',
    name: 'Robot Farm Pals',
    theme: 'Friendly Robots Helping on the Farm',
    emoji: '🚜🤖',
    childName: 'Oliver',
    ageGroup: 'preschool',
    description: 'Solar-powered robot tractors, singing scarecrows, and watering gigantic sunflowers.',
  },
  {
    id: 'dragon-castles',
    name: 'Dragon Castle Picnic',
    theme: 'Gentle Baby Dragons at Castle Playground',
    emoji: '🏰🐉',
    childName: 'Sophia',
    ageGroup: 'preschool',
    description: 'Baby dragons toasting marshmallows, flying kite contests, and rainbow castle slides.',
  },
];
