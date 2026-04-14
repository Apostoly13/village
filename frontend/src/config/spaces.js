export const SPACE_NAME_MAP = {
  "Mum Circle": "Mums Space",
  "Dad Circle": "Dads Space",
  "Sleep Circle": "Sleep & Settling",
  "Feeding Circle": "Feeding",
  "Toddler Circle": "Toddlers",
  "Newborn Circle": "Newborns",
  "School Age Circle": "School Age",
  "Teenager Circle": "Teenagers",
  "Single Parent Circle": "Single Parents",
  "Mental Health Circle": "Mental Health",
};

export function getSpaceName(name) {
  return SPACE_NAME_MAP[name] || (name ? name.replace(/ Circle$/, "") : name);
}
