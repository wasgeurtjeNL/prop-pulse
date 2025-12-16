import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Blog data from local export
const blogsToImport = [
  {
    "id": "cmj6onun40009n0uchsqc0y5y",
    "title": "Why Phuket is the New Playground for Luxury Real Estate Investors",
    "slug": "phuket-luxury-real-estate-investment",
    "excerpt": "Phuket has emerged as a premier destination for luxury real estate investors. Discover the factors driving demand and the promising investment opportunities.",
    "content": "<h2>Introduction</h2><p>Phuket has rapidly transformed into an elite playground for <a href=\"/guides/phuket-luxury-real-estate-trends\" class=\"internal-link\">luxury real estate investors</a>. This tropical paradise offers a unique blend of strong tourism recovery, constrained prime supply, and rising foreign demand that creates an enticing environment for investment. Let's explore why Phuket stands out as a top choice for luxury property enthusiasts.</p><hr><h2>Market Dynamics: Why Investors Are Flocking to Phuket</h2><h3>Tourism Rebound and Spending Mix</h3><p>Thailand's tourism sector is experiencing a robust recovery, with a national campaign targeting high-spend arrivals and long-stay travelers. This influx boosts demand for premium accommodation, such as villas and branded resorts, enhancing short-term rental returns.</p><h3>Lifestyle and Remote Work</h3><p>The growth of digital nomads and international professionals seeking lifestyle residences has led to steady demand beyond peak season. This supports hybrid owner-occupier and rental models, which are highly attractive to foreign buyers.</p><h3>Infrastructure and Policy Support</h3><p>Government and private infrastructure projects aim to improve connectivity and position Phuket as a strategic tourism and economic hub, further supporting long-term demand for <a href=\"/services/luxury-real-estate-development\" class=\"internal-link\">real estate investments</a>.</p><div class=\"highlight-box\"><strong>Key Insight:</strong> Foreign investors account for 60-68% of high-end property purchases, with strong interest from the UK, Hong Kong, the US, and Russian-speaking markets.</div><hr><h2>Submarkets to Watch</h2><h3>Bang Tao / Laguna Corridor</h3><p>Known for its luxury resorts and family-friendly villas, this area consistently outperforms broader island averages, making it a favorite among investors.</p><h3>Layan and Kamala</h3><p>These submarkets are in high demand for private villas, with year-on-year appreciation reported at 12-18% in prime locations.</p><h3>Cherng Talay</h3><p>Growing condo and serviced-apartment activity near lifestyle hubs and schools make this area attractive for hybrid use and family relocation.</p><h3>Rawai / Southern Peninsula</h3><p>This area is increasingly popular among lifestyle buyers seeking quieter luxury living and villa rentals.</p><hr><h2>Returns and Yield Expectations</h2><p>Rental yields in prime villa locations can be strong, with some reports citing yields exceeding 10% in highly touristic areas. Capital appreciation also remains robust, with analysts forecasting double-digit growth in select premium segments.</p><div class=\"stat-highlight\"><span class=\"stat-number\">24%</span><span class=\"stat-text\">increase in foreign investment in <a href=\"/locations/phuket-luxury-real-estate\" class=\"internal-link\">Phuket real estate</a> in the first half of 2025</span></div><hr><h2>Risks and Considerations for Investors</h2><h3>Macro and Currency Exposure</h3><p>Luxury buyers are exposed to global macro volatility and exchange-rate fluctuations that can affect foreign purchasing power and tourism demand.</p><div class=\"warning-box\"><strong>Important:</strong> Conduct due diligence on title, structuring, and tax implications, as foreign ownership in Thailand has legal constraints.</div><h3>Oversupply in Non-Prime Segments</h3><p>While prime beachfront land is scarce, a large number of condo launches risk softening returns in lower-quality, non-prime inventory if absorption slows.</p><hr><h2>Practical Insights for Investors</h2><div class=\"pro-tip\"><strong>Pro Tip:</strong> Prioritize branded residences or professionally managed villas with proven rental programs to maximize occupancy and reduce management risk.</div><p>Focus on micro-location, structure for cash flow, and consult local counsel on legal and tax planning. Assess ESG factors, such as flood and erosion risk, for long-term asset desirability.</p><hr><div class=\"faq-section\"><h2>Frequently Asked Questions</h2><div class=\"faq-item\"><h3>What makes Phuket attractive to luxury real estate investors?</h3><p>Phuket offers strong tourism recovery, constrained prime supply, rising foreign demand, and supportive infrastructure projects, all leading to attractive investment opportunities.</p></div><div class=\"faq-item\"><h3>Which areas in Phuket are best for real estate investment?</h3><p>Submarkets like Bang Tao, Layan, Kamala, and Cherng Talay are popular due to their high demand and potential for appreciation.</p></div><div class=\"faq-item\"><h3>What are the expected returns on investment in Phuket?</h3><p>Rental yields can exceed 10% in prime areas, with capital appreciation forecasts of double-digit growth in select premium segments.</p></div></div><hr><div class=\"cta-box\"><h3>Ready to Invest in Phuket's Luxury Real Estate?</h3><p>Contact Real Estate Pulse today to explore premium opportunities in Phuket's thriving market.</p></div>",
    "coverImage": "https://ik.imagekit.io/slydc8kod/blogs/ai-generated/why-phuket-is-the-new-playground-for-luxury-real-e-cover-1765799462057_RJHN3sNzF.webp",
    "coverImageAlt": "Why Phuket is the New Playground for Luxury Real Estate Investors - real estate guide",
    "tag": "Phuket Real Estate",
    "metaTitle": "Phuket: Emerging Luxury Real Estate Hub",
    "metaDescription": "Discover why Phuket is the top choice for luxury real estate investors: strong tourism, high returns, and limited prime supply drive demand.",
    "published": true,
    "publishedAt": "2025-12-14T21:58:46.822Z",
    "internalLinkCount": 3
  },
  {
    "id": "cmj6p82v3000bn0uce49cgcdh",
    "title": "Navigating Thailand's 99-Year Lease Law: A Guide for Foreign Investors",
    "slug": "navigating-thailands-99-year-lease-law",
    "excerpt": "Explore Thailand's lease laws for foreign investors. Learn how the shelved 99-year lease proposal impacts property strategies in Phuket.",
    "content": "<h2>Understanding Leasehold Rules for Foreigners in Thailand</h2> <p>Foreign investors looking to dive into Thailand's real estate market often face a labyrinth of regulations. Currently, foreigners can secure leaseholds on houses and villas, with a maximum term of 30 years, as per the Civil and Commercial Code. These leases require registration at local Land Offices to ensure enforceability for leases over three years.</p> <div class=\"highlight-box\"><strong>Key Insight:</strong> The proposed 99-year lease law, which aimed to extend lease terms, has been shelved, leaving the 30-year lease framework in place.</div> <h3>Key Registration Requirements</h3> <p>Leases exceeding three years must be registered with the Land Office, necessitating bilingual Thai-English contracts that include comprehensive details such as parties' information, rent schedules, and more. These regulations ensure clarity and minimize disputes for foreign investors.</p> <hr> <h2>The Status of the 99-Year Lease Proposal</h2> <p>The 99-year lease proposal, introduced to attract foreign investment by tripling the current lease terms, was set to benefit tourism hubs like Phuket. However, it was paused and ultimately shelved by the government due to limited mandate and concerns over land sovereignty.</p> <div class=\"stat-highlight\"><span class=\"stat-number\">99</span><span class=\"stat-text\">years was the proposed lease term to boost investment.</span></div> <h3>Exclusions and Limitations</h3> <p>The proposal excluded agricultural land and did not allow for freehold conversion. Despite its potential benefits, societal concern over 'selling the nation' led to its shelving, reflecting the cautious policy approach of the new government.</p> <hr> <h2>Implications for Phuket Real Estate Investors</h2> <p><a href=\"/guides/phuket-luxury-real-estate-trends\" class=\"internal-link\">Phuket's vibrant real estate market</a>, driven by foreign demand for luxury villas and homes, faces uncertainties without longer lease security. The 30-year limit continues to deter some expats and retirees, limiting potential renovations and financing.</p> <div class=\"pro-tip\"><strong>Pro Tip:</strong> Consider structuring leases with renewal clauses and consult local legal experts for compliant contracts.</div> <h3>Market Trends and Statistics</h3> <p>While there are no specific statistics for Phuket, the reform aimed to increase demand in key areas like Phuket. With foreign condo sales capped at 49%, interest is shifting towards leaseholds.</p> <blockquote>\"Longer leases would offer near-freehold security for estate planning,\" notes an industry expert. However, critics warn of potential risks, emphasizing the need for cautious policy.</blockquote> <hr> <h2>How to Navigate the Current Lease Framework</h2> <p>Foreign investors should prioritize securing registered 30-year leases with renewal clauses. Engaging with local legal experts to draft 2025-compliant contracts is crucial for mitigating risks and ensuring protection.</p> <div class=\"warning-box\"><strong>Important:</strong> Ensure all contracts are bilingual and registered to avoid enforceability issues.</div> <div class=\"cta-box\"><h3>Ready to Invest in Phuket?</h3><p>Contact our team at Real Estate Pulse to explore premium opportunities in <a href=\"/locations/phuket-luxury-real-estate\" class=\"internal-link\">Phuket's real estate market</a>.</p></div> <hr> <div class=\"faq-section\"><h2>Frequently Asked Questions</h2> <div class=\"faq-item\"><h3>Can foreigners own property in Thailand?</h3><p>Foreigners can own condominiums but not land. They can lease land for up to 30 years.</p></div> <div class=\"faq-item\"><h3>What was the purpose of the 99-year lease proposal?</h3><p>It aimed to attract more foreign investment by extending lease terms, especially in tourism hubs.</p></div> <div class=\"faq-item\"><h3>How should investors proceed without the 99-year lease?</h3><p>Investors should focus on securing registered 30-year leases with renewal options.</p></div></div>",
    "coverImage": "https://ik.imagekit.io/slydc8kod/blogs/ai-generated/navigating-thailand-s-99-year-lease-law-a-guide-fo-cover-1765799323607_5Nc1HoarD.webp",
    "coverImageAlt": "Navigating Thailand's 99-Year Lease Law: A Guide for Foreign Investors - PropPulse blog",
    "tag": "Thailand real estate",
    "metaTitle": "Thailand 99-Year Lease Law: Guide for Investors",
    "metaDescription": "Understand Thailand's lease laws for foreign investors and how the shelved 99-year lease affects real estate strategies.",
    "published": true,
    "publishedAt": "2025-12-14T22:14:19.107Z",
    "internalLinkCount": 2
  },
  {
    "id": "cmj72e434000008uc4o6bqife",
    "title": "Living the High Life: Luxury Lifestyle Trends in Phuket",
    "slug": "living-high-life-luxury-lifestyle-trends-phuket",
    "excerpt": "Explore Phuket's booming luxury real estate market in 2025. From eco-friendly villas to investment hotspots, learn what drives affluent buyers.",
    "content": "<h2>Phuket's Luxury Real Estate Market in 2025</h2><p>Phuket's luxury real estate market is set to boom in 2025, driven by a surge in foreign investment, tourism recovery, and a growing demand for high-end villas and branded residences. This growth is fueled by the allure of exclusivity, sustainability, and strong rental yields, particularly in prime areas like Bang Tao and Laguna. These factors position Phuket as a top destination for affluent buyers seeking both lifestyle and investment returns.</p><div class=\"stat-highlight\"><span class=\"stat-number\">60%</span><span class=\"stat-text\"> of high-end sales are dominated by foreign buyers.</span></div><p>With a 24% rise in foreign investment in the first half of 2025 alone, the market shows no signs of slowing down. Villa prices have surged by 12-18% year-on-year in areas like Layan, Kamala, and Bang Tao, while condo prices have increased by 7-10%.</p><hr><h2>Dominant Luxury Lifestyle Trends</h2><h3>Sustainability and Branded Residences</h3><p>Today's buyers prioritize eco-friendly villas with energy-efficient designs and affiliations to global hotel chains for managed rentals and privacy. The demand for sustainable luxury is on the rise, making eco-materials and branded management key drivers in the market.</p><div class=\"highlight-box\"><strong>Key Insight:</strong> Eco-friendly villas in areas like Laguna and Rawai offer high rental returns and align with sustainability trends.</div><h3>Tourism-Fueled Demand</h3><p>As part of Thailand's \"Grand Tourism Year 2025,\" the goal is to attract 38-40 million visitors, generating 3.4 trillion baht. This influx boosts the need for premium villas, condos, and resorts near beaches in Bang Tao, Kamala, Patong, and Rawai.</p><h3>Second Homes and Exclusivity</h3><p>High-net-worth individuals from Russia, China, Europe, and the Middle East are seeking beachfront properties that blend resort living with amenities like international schools, golf courses, and upscale dining options.</p><h3>Infrastructure Boost</h3><p>Road expansions, monorails, airport upgrades, and government initiatives enhance accessibility, driving up property values in west coast hotspots like Cherng Talay.</p><hr><h2>Expert Insights for Investors</h2><blockquote>\"Phuket's premium market meets lifestyle and returns,\" noted by experts from Knight Frank Thailand, highlighting branded resort living and steady tourism as core to 15-20% growth forecasts.</blockquote><p>With limited prime land, scarcity value is amplified. However, while momentum is strong, it's crucial to monitor global economics and balance development with environmental preservation to sustain long-term appeal.</p><div class=\"pro-tip\"><strong>Pro Tip:</strong> Villas in beach-adjacent lifestyle hubs offer the best entry now for ROI, especially before major infrastructure completions.</div><hr><div class=\"faq-section\"><h2>Frequently Asked Questions</h2><div class=\"faq-item\"><h3>What makes Phuket a top destination for luxury real estate?</h3><p>Phuket offers exclusivity, sustainability, and strong rental yields, making it attractive for affluent buyers seeking lifestyle and investment returns.</p></div><div class=\"faq-item\"><h3>How has foreign investment impacted Phuket's real estate market?</h3><p>Foreign buyers dominate high-end sales, comprising over 60% of new purchases, with a 24% rise in foreign investment in 2025.</p></div><div class=\"faq-item\"><h3>What are the rental yield expectations in prime areas?</h3><p>Rental yields exceed 10% annually in prime areas like Bang Tao and Laguna, driven by short-term holiday lets.</p></div></div><hr><div class=\"cta-box\"><h3>Ready to Invest in Phuket's Luxury Real Estate?</h3><p>Explore exclusive opportunities with Real Estate Pulse. Contact us to find your dream property in Phuket.</p></div>",
    "coverImage": "https://ik.imagekit.io/slydc8kod/blogs/ai-generated/living-the-high-life-luxury-lifestyle-trends-in-ph-cover-1765797741278_kfNMWqHC0.webp",
    "coverImageAlt": "Living the High Life: Luxury Lifestyle Trends in Phuket - real estate guide",
    "tag": "Phuket Real Estate",
    "metaTitle": "Luxury Lifestyle Trends in Phuket for 2025",
    "metaDescription": "Discover Phuket's luxury real estate surge, eco-friendly villas, and top investment hotspots for affluent buyers in 2025.",
    "published": true,
    "publishedAt": "2025-12-15T04:22:37.643Z",
    "internalLinkCount": 2
  },
  {
    "id": "cmj730p3l000208uc3y1ibiaq",
    "title": "The Rise of Co-Living Spaces in Phuket: A New Investor Opportunity",
    "slug": "rise-co-living-spaces-phuket-investors",
    "excerpt": "Co-living spaces in Phuket are on the rise, driven by digital nomads and young professionals. Explore the investment potential in this booming market.",
    "content": "<h2>The Rise of Co-Living Spaces in Phuket</h2><p>As the demand for flexible and community-focused housing solutions grows, co-living spaces in Phuket have emerged as a promising investment opportunity. This trend is largely driven by digital nomads, remote workers, and young professionals seeking affordable living options.</p><div class=\"highlight-box\"><strong>Key Insight:</strong> Co-living spaces blend long-term rental yields with tourism demand, particularly in areas like Patong, Rawai, and Phuket Town.</div><hr/><h2>Key Market Insights</h2><h3>Market Surge in Phuket</h3><p>The Phuket property market is witnessing a significant surge. Condominium sales have jumped by <div class=\"stat-highlight\"><span class=\"stat-number\">201%</span><span class=\"stat-text\"> YoY</span></div>, while villas have increased by <div class=\"stat-highlight\"><span class=\"stat-number\">148%</span><span class=\"stat-text\"> YoY</span></div>. Total residential sales are expected to exceed <div class=\"stat-highlight\"><span class=\"stat-number\">THB 45 billion</span><span class=\"stat-text\"> in H1 2025</span></div>.</p><h3>Price Trends</h3><p>Average condo prices in Phuket are projected to reach <div class=\"stat-highlight\"><span class=\"stat-number\">THB 140,000/sqm</span><span class=\"stat-text\"> (~USD 4,000/sqm) in 2025</span></div>, marking a 7-10% YoY increase. Villas in Layan and Kamala have seen price rises of 12-18% YoY.</p><h3>Foreign Buyer Dominance</h3><p>Foreign buyers dominate over 60% of high-end sales, with foreign condo transfers up by 3.1% YoY in Thailand from Q1 to Q3 2024.</p><hr/><h2>Driving Trends and Investor Opportunities</h2><h3>Digital Nomads and Remote Work</h3><p>The influx of digital nomads and remote workers is boosting the demand for co-living spaces that offer flexible rental terms and a sense of community.</p><div class=\"pro-tip\"><strong>Pro Tip:</strong> Target investments in areas popular with digital nomads, such as Patong and Rawai, for higher occupancy rates.</div><h3>Shift to Rentals</h3><p>Rising homeownership costs are pushing younger generations towards co-living and flexible rentals, especially in tourism hubs like Phuket.</p><h3>Tourism Recovery</h3><p>Accommodation occupancy rates are nearing pre-pandemic levels, further fueling demand for co-living spaces alongside traditional short-term rentals.</p><hr/><h2>Expert Insights</h2><blockquote>\"Phuket's market is growing fast... co-living setups are perfect for [digital nomads] offering affordable living with shared amenities.\" - Assetwise PCL</blockquote><hr/><h2>Frequently Asked Questions</h2><div class=\"faq-section\"><div class=\"faq-item\"><h3>What makes co-living spaces attractive to investors in Phuket?</h3><p>Co-living spaces offer high occupancy rates due to their affordability and community-oriented environment, appealing to digital nomads and young professionals.</p></div><div class=\"faq-item\"><h3>Which areas in Phuket are ideal for investing in co-living spaces?</h3><p>Popular areas include Patong, Rawai, and Phuket Town, known for their appeal to digital nomads and tourists.</p></div><div class=\"faq-item\"><h3>How does the foreign buyer market impact co-living investments?</h3><p>With over 60% of high-end sales dominated by foreign buyers, there is strong international interest in co-living investments, particularly in prime locations.</p></div></div><hr/><div class=\"cta-box\"><h3>Ready to Invest in Co-Living Spaces?</h3><p>Explore our premium listings and discover the potential of co-living spaces in Phuket. Contact Real Estate Pulse for expert guidance.</p></div>",
    "coverImage": "https://ik.imagekit.io/slydc8kod/blogs/ai-generated/the-rise-of-co-living-spaces-in-phuket-a-new-inves-cover-1765799374588_vH93TQTeZ.webp",
    "coverImageAlt": "The Rise of Co-Living Spaces in Phuket: A New Investor Opportunity - PropPulse blog",
    "tag": "real estate",
    "metaTitle": "Co-Living Spaces in Phuket: A New Era for Investors",
    "metaDescription": "Discover how co-living spaces in Phuket offer lucrative investment opportunities amid rising demand from digital nomads and young professionals.",
    "published": true,
    "publishedAt": "2025-12-15T04:40:09.087Z",
    "internalLinkCount": 0
  },
  {
    "id": "cmj7a0pyq0012kkuccgtpsw50",
    "title": "Tourism's 2026 Impact on Phuket's Real Estate",
    "slug": "impact-tourism-phuket-real-estate-2026",
    "excerpt": "Discover the projected influence of tourism on Phuket's real estate market by 2026. Learn about luxury trends, infrastructure upgrades, and investment opportunities.",
    "content": "<h2>Tourism Growth and Real Estate Demand</h2><p>Phuket's tourism industry is a powerhouse, with the island welcoming over 9 million international visitors annually pre-pandemic. This trend is expected to rebound by 2024, stimulating the real estate market. Increased flights and relaxed travel restrictions are key factors boosting this resurgence.</p><hr><h2>Luxury and Branded Residences on the Rise</h2><p>The demand for luxury villas and branded residences is growing among affluent tourists and investors. These properties offer exclusive experiences and are often managed by international hotel brands, providing hotel-like amenities. This trend aligns with Phuket's reputation as a luxury destination.</p><hr><h2>Sustainable Developments and Environmental Impact</h2><p>Environmental concerns are driving developers towards sustainable projects. Properties with green certifications and energy-efficient designs are becoming highly sought after. This shift not only addresses environmental degradation but also enhances long-term real estate value.</p><hr><h2>The Digital Nomad Influence</h2><p>Phuket is attracting digital nomads, drawn by the island's quality of life and improved digital infrastructure. This trend increases demand for long-term rental properties and co-living spaces.</p><hr><h2>Infrastructure Developments and Accessibility</h2><p>Ongoing infrastructure improvements, such as the expansion of Phuket International Airport and enhanced road networks, are expected to boost the island's accessibility. These developments are likely to stimulate real estate growth and create new investment opportunities.</p><hr><div class=\"faq-section\"><h2>Frequently Asked Questions</h2><div class=\"faq-item\"><h3>How is tourism expected to impact Phuket's real estate market by 2026?</h3><p>Tourism is projected to drive demand for luxury and branded residences, sustainable developments, and long-term rental properties, influenced by digital nomads and infrastructure improvements.</p></div><div class=\"faq-item\"><h3>What are the main challenges facing Phuket's real estate market?</h3><p>Key challenges include regulatory barriers for foreign investors, environmental concerns, and potential market saturation in specific segments like mid-range condominiums.</p></div><div class=\"faq-item\"><h3>What role do digital nomads play in Phuket's real estate market?</h3><p>Digital nomads increase demand for long-term rental properties and co-living spaces, contributing to the growth of Phuket's real estate market.</p></div></div><hr><div class=\"cta-box\"><h3>Ready to Invest in Phuket?</h3><p>Contact Real Estate Pulse to explore premium opportunities in Phuket's thriving market.</p></div>",
    "coverImage": "https://ik.imagekit.io/slydc8kod/blogs/ai-generated/tourism-s-2026-impact-on-phuket-s-real-estate-cover-1765810743976_SpmKXE5Dv.webp",
    "coverImageAlt": "Tourism's 2026 Impact on Phuket's Real Estate - real estate guide",
    "tag": "Phuket real estate",
    "metaTitle": "Tourism's Impact on Phuket Real Estate in 2026",
    "metaDescription": "Explore how tourism will shape Phuket's real estate market by 2026, focusing on luxury trends, infrastructure, and investment opportunities.",
    "published": true,
    "publishedAt": "2025-12-15T07:56:07.534Z",
    "internalLinkCount": 0
  }
];

// Temporary endpoint to import blogs - DELETE AFTER USE
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const results = [];
    
    for (const blog of blogsToImport) {
      try {
        // Check if blog with this slug already exists
        const existing = await prisma.blog.findUnique({
          where: { slug: blog.slug },
        });

        if (existing) {
          results.push({ slug: blog.slug, status: "skipped", reason: "already exists" });
          continue;
        }

        // Create the blog
        await prisma.blog.create({
          data: {
            title: blog.title,
            slug: blog.slug,
            excerpt: blog.excerpt,
            content: blog.content,
            coverImage: blog.coverImage,
            coverImageAlt: blog.coverImageAlt,
            tag: blog.tag,
            metaTitle: blog.metaTitle,
            metaDescription: blog.metaDescription,
            published: blog.published,
            publishedAt: blog.publishedAt ? new Date(blog.publishedAt) : null,
            internalLinkCount: blog.internalLinkCount || 0,
            authorId: user.id, // Use current user as author
          },
        });

        results.push({ slug: blog.slug, status: "imported" });
      } catch (error) {
        results.push({ 
          slug: blog.slug, 
          status: "error", 
          reason: error instanceof Error ? error.message : "Unknown error" 
        });
      }
    }

    const imported = results.filter(r => r.status === "imported").length;
    const skipped = results.filter(r => r.status === "skipped").length;
    const errors = results.filter(r => r.status === "error").length;

    return NextResponse.json({
      success: true,
      summary: { imported, skipped, errors, total: blogsToImport.length },
      results,
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}

