/**
 * Random display name generator for the room access forms.
 * Pairs a programming flavoured adjective with an animal sharing its first
 * letter, e.g. "Async Axolotl" or "Nullable Narwhal".
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

interface NamePool {
  adjectives: readonly string[];
  animals: readonly string[];
}

const NAME_POOLS: readonly NamePool[] = [
  {
    adjectives: ["Async", "Atomic", "Abstract"],
    animals: ["Axolotl", "Alpaca", "Armadillo"],
  },
  {
    adjectives: ["Binary", "Buggy", "Buffered"],
    animals: ["Badger", "Beaver", "Bison"],
  },
  {
    adjectives: ["Cached", "Compiled", "Concurrent"],
    animals: ["Capybara", "Cheetah", "Chameleon"],
  },
  {
    adjectives: ["Deprecated", "Debugged", "Dynamic"],
    animals: ["Dodo", "Dolphin", "Dingo"],
  },
  {
    adjectives: ["Encrypted", "Elastic", "Eager"],
    animals: ["Eel", "Emu", "Elk"],
  },
  {
    adjectives: ["Functional", "Forked", "Fuzzy"],
    animals: ["Ferret", "Flamingo", "Fox"],
  },
  {
    adjectives: ["Greedy", "Generic", "Global"],
    animals: ["Gecko", "Gibbon", "Gazelle"],
  },
  {
    adjectives: ["Hashed", "Headless", "Hoisted"],
    animals: ["Hedgehog", "Heron", "Hamster"],
  },
  {
    adjectives: ["Immutable", "Indexed", "Inline"],
    animals: ["Ibis", "Iguana", "Impala"],
  },
  {
    adjectives: ["Jittery", "Just-in-Time", "Jumbled"],
    animals: ["Jaguar", "Jellyfish", "Jackal"],
  },
  {
    adjectives: ["Kernel", "Keyed", "Kinetic"],
    animals: ["Koala", "Kiwi", "Kingfisher"],
  },
  {
    adjectives: ["Lazy", "Looping", "Linked"],
    animals: ["Llama", "Lemur", "Lynx"],
  },
  {
    adjectives: ["Minified", "Mutable", "Modular"],
    animals: ["Moose", "Meerkat", "Marmot"],
  },
  {
    adjectives: ["Nullable", "Nested", "Native"],
    animals: ["Narwhal", "Newt", "Nightingale"],
  },
  {
    adjectives: ["Optimised", "Overloaded", "Orphaned"],
    animals: ["Otter", "Ocelot", "Orca"],
  },
  {
    adjectives: ["Parallel", "Pure", "Pinned"],
    animals: ["Panda", "Pangolin", "Puffin"],
  },
  {
    adjectives: ["Quantum", "Queued", "Quirky"],
    animals: ["Quokka", "Quail", "Quetzal"],
  },
  {
    adjectives: ["Recursive", "Reactive", "Refactored"],
    animals: ["Raccoon", "Red Panda", "Reindeer"],
  },
  {
    adjectives: ["Static", "Sorted", "Serverless"],
    animals: ["Sloth", "Seal", "Salamander"],
  },
  {
    adjectives: ["Typed", "Threaded", "Tail-Called"],
    animals: ["Tapir", "Toucan", "Tortoise"],
  },
  {
    adjectives: ["Unbuffered", "Untyped", "Unrolled"],
    animals: ["Urchin", "Unicorn", "Uakari"],
  },
  {
    adjectives: ["Volatile", "Virtual", "Vectorised"],
    animals: ["Vole", "Vulture", "Viper"],
  },
  {
    adjectives: ["Wrapped", "Wired", "Wildcard"],
    animals: ["Walrus", "Wombat", "Wolverine"],
  },
  {
    adjectives: ["Yielding", "YAML", "Yanked"],
    animals: ["Yak", "Yellowjacket", "Yapok"],
  },
  {
    adjectives: ["Zero-Day", "Zipped", "Zen"],
    animals: ["Zebra", "Zebu", "Zorilla"],
  },
];

const pick = <T>(items: readonly T[]): T =>
  items[Math.floor(Math.random() * items.length)] as T;

/**
 * Generates a random alliterative display name
 * @param previous - The current name, which is never rolled twice in a row
 * @returns A name such as "Recursive Raccoon"
 */
export const generateRandomName = (previous = ""): string => {
  let name = previous;
  while (name === previous) {
    const { adjectives, animals } = pick(NAME_POOLS);
    name = `${pick(adjectives)} ${pick(animals)}`;
  }
  return name;
};
