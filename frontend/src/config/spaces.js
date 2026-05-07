export const SPACE_NAME_MAP = {
  // Legacy Circle names → display names
  "Mum Circle":          "Mums of The Village",
  "Dad Circle":          "Dads of The Village",
  "Sleep Circle":        "Sleep & Settling",
  "Feeding Circle":      "Feeding",
  "Toddler Circle":      "Toddlers",
  "Newborn Circle":      "Newborns",
  "School Age Circle":   "School Age",
  "Teenager Circle":     "Teenagers",
  "Single Parent Circle":"Solo Parents",
  "Mental Health Circle":"Parent Wellbeing",

  // Legacy Space names → canonical display names
  "Mums Space":          "Mums of The Village",
  "Dad Space":           "Dads of The Village",
  "Feeding Space":       "Feeding",
  "Sleep Space":         "Sleep & Settling",
  "Mental Health Space": "Parent Wellbeing",
  "Single Parents Space":"Solo Parents",
  "Just Venting":        "Real Talk",
  "Vent Room":           "Real Talk",
  "Relationships":       "Family & Relationships",
  "Local Meetups":       "Local Village",
  "Newborn Space":       "Newborns",
  "Infant Space":        "Babies",
  "Toddler Space":       "Toddlers",
  "School Age Space":    "School Age",
  "Teenager Space":      "Teenagers",
  "Expecting Space":     "Pregnancy & Expecting",

  // Legacy chat room names
  "Single Parents Lounge": "Solo Parents Chat",
  "3am Club":              "The 3am Club",
};

export function getSpaceName(name) {
  return SPACE_NAME_MAP[name] || (name ? name.replace(/ (Circle|Space)$/, "") : name);
}
