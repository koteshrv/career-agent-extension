export function companyInitials(name: string): string {
  if (!name) return "?";
  
  const cleaned = name
    .replace(/\b(Inc\.?|LLC|Ltd\.?|Limited|GmbH|Co\.?|Corp\.?|Corporation|SA|AG|PLC)\b/gi, "")
    .replace(/[^\w\s-]/g, " ")
    .trim();
    
  if (!cleaned) return name.substring(0, 1).toUpperCase();

  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) {
    const word = words[0];
    const caps = word.match(/[A-Z]/g);
    if (caps && caps.length >= 2 && caps.length < word.length) {
      return (caps[0] + caps[1]).toUpperCase();
    }
    return word.substring(0, 1).toUpperCase();
  }
  
  return (words[0].substring(0, 1) + words[1].substring(0, 1)).toUpperCase();
}

export function monogramHue(name: string): number {
  if (!name) return 0;
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash % 360);
}

const DOMAIN_OVERRIDES: Record<string, string> = {
  "anthropic": "anthropic.com", "openai": "openai.com", "google": "google.com",
  "meta": "meta.com", "facebook": "meta.com", "microsoft": "microsoft.com",
  "apple": "apple.com", "amazon": "amazon.com", "netflix": "netflix.com",
  "x": "x.com", "twitter": "x.com", "stripe": "stripe.com", "shopify": "shopify.com",
  "airbnb": "airbnb.com", "uber": "uber.com", "spotify": "spotify.com",
  "linkedin": "linkedin.com", "github": "github.com", "gitlab": "gitlab.com",
  "notion": "notion.so", "figma": "figma.com", "databricks": "databricks.com",
  "snowflake": "snowflake.com", "cloudflare": "cloudflare.com", "vercel": "vercel.com",
  "hugging face": "huggingface.co", "huggingface": "huggingface.co",
  "cohere": "cohere.com", "mistral ai": "mistral.ai", "mistral": "mistral.ai",
  "perplexity": "perplexity.ai", "coinbase": "coinbase.com", "atlassian": "atlassian.com",
  "salesforce": "salesforce.com", "oracle": "oracle.com", "ibm": "ibm.com",
  "tcs": "tcs.com", "infosys": "infosys.com", "wipro": "wipro.com",
  "accenture": "accenture.com", "cognizant": "cognizant.com", "capgemini": "capgemini.com",
  "deloitte": "deloitte.com", "zoho": "zoho.com", "flipkart": "flipkart.com",
  "swiggy": "swiggy.com", "razorpay": "razorpay.com", "paytm": "paytm.com",
  "deepgram": "deepgram.com", "supabase": "supabase.com", "hightouch": "hightouch.com",
  "arize ai": "arize.com", "parloa": "parloa.com", "glean": "glean.com",
  "amplemarket": "amplemarket.com", "later": "later.com", "planetscale": "planetscale.com",
  "sierra": "sierra.ai", "celonis": "celonis.com", "faculty": "faculty.ai",
  "airtable": "airtable.com", "travelperk": "travelperk.com", "synthesia": "synthesia.io",
  "intercom": "intercom.com", "langchain": "langchain.com", "hume ai": "hume.ai",
  "pinecone": "pinecone.io", "ramp": "ramp.com",
};

export function guessCompanyDomains(name: string): string[] {
  if (!name) return [];
  const base = name.trim();
  const key = base.toLowerCase();
  const candidates: string[] = [];
  
  if (DOMAIN_OVERRIDES[key]) {
    candidates.push(DOMAIN_OVERRIDES[key]);
  }

  const cleaned = key
    .replace(/\b(inc|llc|ltd|limited|gmbh|co|corp|corporation|sa|ag|plc|technologies|technology|labs|systems)\b/gi, " ")
    .replace(/[.,&'’/()|]+/g, " ");
    
  const slug = cleaned.replace(/\s+/g, "");
  if (slug && !DOMAIN_OVERRIDES[key]) {
    candidates.push(slug + ".com");
    candidates.push(slug + ".ai");
    candidates.push(slug + ".io");
    candidates.push(slug + ".co");
  }

  return [...new Set(candidates)];
}
