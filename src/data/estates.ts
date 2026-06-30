/**
 * Common Kenyan estates / neighbourhoods / sub-localities. These are
 * fine-grained and locating, so they are REDACTED to [LOCATION_KE_n].
 *
 * Multi-word entries (e.g. "South B") are matched as whole phrases. The base
 * Rampart model is trained on Western address formats and will not reliably
 * recognise these, so the gazetteer drives detection directly. Extend freely.
 */
export const ESTATES: readonly string[] = [
  // Nairobi
  "Kilimani", "Kileleshwa", "Lavington", "Westlands", "Karen", "Langata",
  "South B", "South C", "Buruburu", "Donholm", "Umoja", "Kasarani",
  "Roysambu", "Githurai", "Zimmerman", "Kahawa", "Kahawa West", "Eastleigh",
  "Pangani", "Parklands", "Ngara", "Embakasi", "Pipeline", "Kayole",
  "Dandora", "Kibera", "Mathare", "Huruma", "Komarock", "Ruai", "Utawala",
  "Kawangware", "Riruta", "Dagoretti", "Gigiri", "Runda", "Muthaiga",
  "Makadara", "Jamhuri", "Madaraka", "Nyayo Estate", "Pumwani", "Kangemi",
  "Lucky Summer", "Mwiki", "Saika", "Kariobangi", "Babadogo",
  // Greater metro / satellite
  "Rongai", "Syokimau", "Mlolongo", "Kitengela", "Juja", "Ruiru", "Kikuyu",
  "Ngong", "Athi River",
  // Coast
  "Nyali", "Bamburi", "Likoni", "Kisauni", "Mtwapa", "Bombolulu", "Shanzu",
  // Other towns' estates
  "Milimani", "Pioneer", "Section 58",
];
