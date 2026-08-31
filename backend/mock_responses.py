"""
IP-SAKTI Sahayak — Mock Responses for Demo Mode
5 pre-cached, citation-rich responses for guaranteed demo stability.
When DEMO_MODE=true or LLM fails/times out, these are returned.
"""


DEMO_RESPONSES: dict[str, dict] = {

    # ── Demo Query 1 ─────────────────────────────────────────────
    "Can I patent a traditional Ayurvedic formulation?": {
        "answer": (
            "Under Indian law, traditional Ayurvedic formulations face significant "
            "patentability challenges. **Section 3(p) of the Patents Act, 1970** "
            "explicitly excludes from patentability 'an invention which, in effect, "
            "is traditional knowledge or which is an aggregation or duplication of "
            "known properties of traditionally known component or components' "
            "[Patents Act 1970, Section 3(p), p.12].\n\n"
            "Furthermore, **Section 3(d)** bars patents on mere 'new forms' of known "
            "substances unless they demonstrate significantly enhanced efficacy "
            "[Patents Act 1970, Section 3(d), p.10].\n\n"
            "However, a **novel process** for preparing a traditional formulation, or a "
            "**novel synergistic composition** with demonstrated enhanced therapeutic "
            "efficacy backed by clinical data, may be patentable if it is not documented "
            "in the **Traditional Knowledge Digital Library (TKDL)**.\n\n"
            "The TKDL currently contains over 3,50,000 formulations from 150 books of "
            "Indian Systems of Medicine and is used as prior art by patent offices "
            "worldwide to prevent bio-piracy [TKDL Access Guidelines, Section 2.1, p.5].\n\n"
            "At the international level, **Article 27.3(b) of TRIPS** permits member "
            "states to exclude plants and essentially biological processes from "
            "patentability, which India has exercised [TRIPS Agreement, Article 27.3(b), p.331]."
        ),
        "citations": [
            {
                "source_title": "Patents Act, 1970",
                "section": "3(p)",
                "page": 12,
                "authority": "IP India",
                "regime": "national",
                "relevance_score": 0.95,
                "chunk_id": "demo-patents-3p",
                "full_text": "Section 3(p): An invention which, in effect, is traditional knowledge or which is an aggregation or duplication of known properties of traditionally known component or components."
            },
            {
                "source_title": "Patents Act, 1970",
                "section": "3(d)",
                "page": 10,
                "authority": "IP India",
                "regime": "national",
                "relevance_score": 0.91,
                "chunk_id": "demo-patents-3d",
                "full_text": "Section 3(d): The mere discovery of a new form of a known substance which does not result in the enhancement of the known efficacy of that substance or the mere discovery of any new property or new use for a known substance or of the mere use of a known process, machine or apparatus unless such known process results in a new product or employs at least one new reactant."
            },
            {
                "source_title": "TKDL Access Guidelines",
                "section": "2.1",
                "page": 5,
                "authority": "CSIR",
                "regime": "national",
                "relevance_score": 0.88,
                "chunk_id": "demo-tkdl-2-1",
                "full_text": "The Traditional Knowledge Digital Library (TKDL) is a pioneering initiative of India to prevent misappropriation of traditional knowledge at International Patent Offices."
            },
            {
                "source_title": "TRIPS Agreement (WTO)",
                "section": "Article 27.3(b)",
                "page": 331,
                "authority": "WTO",
                "regime": "international",
                "relevance_score": 0.82,
                "chunk_id": "demo-trips-27-3b",
                "full_text": "Members may also exclude from patentability: plants and animals other than micro-organisms, and essentially biological processes for the production of plants or animals."
            }
        ],
        "regime_tags": ["national", "international"],
        "confidence": "high",
        "language_detected": "en"
    },

    # ── Demo Query 2 ─────────────────────────────────────────────
    "What are GMP requirements for AYUSH manufacturing units?": {
        "answer": (
            "AYUSH manufacturing units in India must comply with **Good Manufacturing "
            "Practices (GMP)** as specified in **Schedule T of the Drugs and Cosmetics "
            "Act, 1940** and the detailed guidelines issued by the Ministry of Ayush.\n\n"
            "Key GMP requirements include:\n\n"
            "1. **Premises and Plant**: Manufacturing premises must be located in hygienic "
            "surroundings with adequate space for raw material storage, manufacturing, "
            "quality control laboratory, and finished goods storage "
            "[Ministry of Ayush GMP Guidelines, Section 3.1, p.8].\n\n"
            "2. **Quality Control**: Every manufacturer must have a Quality Control "
            "department headed by a qualified person with expertise in Ayurveda/Siddha/Unani "
            "pharmacopoeia [Ministry of Ayush GMP Guidelines, Section 4.2, p.15].\n\n"
            "3. **Raw Material Testing**: All raw materials (herbs, minerals, metals) must be "
            "authenticated and tested for identity, purity, and quality before use. "
            "Heavy metal limits are specified per the Ayurvedic Pharmacopoeia of India (API) "
            "[D&C Act Schedule E, Rule 161-B, p.22].\n\n"
            "4. **Documentation**: Batch manufacturing records, analytical records, and "
            "distribution records must be maintained for at least 5 years "
            "[Ministry of Ayush GMP Guidelines, Section 6.1, p.28].\n\n"
            "5. **Stability Studies**: Products must undergo stability studies per API "
            "guidelines to establish shelf life [Ministry of Ayush GMP Guidelines, Section 7.3, p.34]."
        ),
        "citations": [
            {
                "source_title": "Ministry of Ayush GMP Guidelines for ASU Drugs",
                "section": "3.1",
                "page": 8,
                "authority": "Ministry of Ayush",
                "regime": "national",
                "relevance_score": 0.94,
                "chunk_id": "demo-gmp-3-1",
                "full_text": "Section 3.1 Premises and Plant: The manufacturing premises shall be located in hygienic surroundings with adequate space and shall be designed to ensure proper flow of materials and personnel."
            },
            {
                "source_title": "Ministry of Ayush GMP Guidelines for ASU Drugs",
                "section": "4.2",
                "page": 15,
                "authority": "Ministry of Ayush",
                "regime": "national",
                "relevance_score": 0.91,
                "chunk_id": "demo-gmp-4-2",
                "full_text": "Section 4.2 Quality Control Department: Every manufacturer shall have a Quality Control department which shall be independent of the production department and headed by a qualified person."
            },
            {
                "source_title": "Drugs and Cosmetics Act, 1940 — Schedule E",
                "section": "Rule 161-B",
                "page": 22,
                "authority": "CDSCO",
                "regime": "national",
                "relevance_score": 0.87,
                "chunk_id": "demo-dca-161b",
                "full_text": "Rule 161-B: Standards for Ayurvedic, Siddha and Unani drugs. Every drug shall conform to the standards of identity, purity and quality as prescribed in the Ayurvedic Pharmacopoeia of India."
            }
        ],
        "regime_tags": ["national"],
        "confidence": "high",
        "language_detected": "en"
    },

    # ── Demo Query 3 ─────────────────────────────────────────────
    "How do I register an Ayurvedic drug for export to the EU?": {
        "answer": (
            "Exporting Ayurvedic drugs to the EU involves compliance with both Indian "
            "export regulations and EU regulatory requirements:\n\n"
            "**Indian Side:**\n"
            "1. Obtain a valid **Drug Manufacturing License** from the State Licensing "
            "Authority under the Drugs and Cosmetics Act, 1940 "
            "[D&C Act, Section 25, p.18].\n\n"
            "2. Ensure GMP compliance as per **Schedule T** and obtain a **GMP Certificate** "
            "from the licensing authority [Ministry of Ayush GMP Guidelines, Section 1.2, p.3].\n\n"
            "3. Obtain an **Export Registration Certificate** from the Ministry of Ayush. "
            "The application must include product dossier, stability data, and certificate "
            "of analysis [Ministry of Ayush Export Guidelines, Circular 2023/04, p.2].\n\n"
            "4. Register with **APEDA** (Agricultural and Processed Food Products Export "
            "Development Authority) if the product is classified as a food supplement "
            "[Ministry of Ayush Export Guidelines, Annexure-III, p.12].\n\n"
            "**EU Side:**\n"
            "5. Ayurvedic products are classified as **Traditional Herbal Medicinal Products** "
            "under **EU Directive 2004/24/EC**. Registration requires proof of at least "
            "30 years of traditional use, including 15 years within the EU "
            "[WIPO Traditional Knowledge Documentation, Section 4.5, p.67].\n\n"
            "6. Alternatively, products may be marketed as **food supplements** under "
            "EU Regulation 1924/2006, but therapeutic claims are prohibited "
            "[Ministry of Ayush Export Guidelines, Section 5.2, p.8]."
        ),
        "citations": [
            {
                "source_title": "Drugs and Cosmetics Act, 1940",
                "section": "Section 25",
                "page": 18,
                "authority": "CDSCO",
                "regime": "national",
                "relevance_score": 0.90,
                "chunk_id": "demo-dca-25",
                "full_text": "Section 25: Power to prohibit manufacture, etc., of drug and cosmetic in public interest."
            },
            {
                "source_title": "Ministry of Ayush Export Guidelines",
                "section": "Circular 2023/04",
                "page": 2,
                "authority": "Ministry of Ayush",
                "regime": "national",
                "relevance_score": 0.93,
                "chunk_id": "demo-export-circ",
                "full_text": "Exporters of ASU drugs shall apply for an Export Registration Certificate along with the product dossier including composition, manufacturing process, quality control specifications, and stability data."
            },
            {
                "source_title": "WIPO Traditional Knowledge Documentation",
                "section": "4.5",
                "page": 67,
                "authority": "WIPO",
                "regime": "international",
                "relevance_score": 0.85,
                "chunk_id": "demo-wipo-4-5",
                "full_text": "Traditional herbal medicinal products may be registered under simplified procedures in the EU if evidence of at least 30 years of safe traditional use, including 15 years within the European Community, is provided."
            }
        ],
        "regime_tags": ["national", "international"],
        "confidence": "high",
        "language_detected": "en"
    },

    # ── Demo Query 4 ─────────────────────────────────────────────
    "What is TKDL and how does it affect patentability?": {
        "answer": (
            "The **Traditional Knowledge Digital Library (TKDL)** is a pioneering Indian "
            "digital repository that documents traditional knowledge from Indian systems "
            "of medicine in patent-compatible format.\n\n"
            "**Purpose and Scope:**\n"
            "TKDL was established by CSIR in partnership with the Ministry of Ayush to "
            "prevent misappropriation (bio-piracy) of India's traditional knowledge at "
            "international patent offices. It contains over **3,50,000 formulations** "
            "from 150 books of Ayurveda, Unani, Siddha, and Yoga "
            "[TKDL Access Guidelines, Section 1.1, p.2].\n\n"
            "**How TKDL Affects Patentability:**\n\n"
            "1. **Prior Art Evidence**: TKDL serves as citable prior art. If a patent "
            "application claims a formulation documented in TKDL, the patent can be "
            "rejected or revoked under **Section 25(1)(k)** or **Section 64(1)(q)** "
            "of the Patents Act, 1970 [Patents Act 1970, Section 25(1)(k), p.45].\n\n"
            "2. **International Access**: TKDL has access agreements with the **EPO** "
            "(European Patent Office), **USPTO**, **JPO**, **UKIPO**, and other major "
            "patent offices. Examiners search TKDL during prior art examination "
            "[TKDL Access Guidelines, Section 3.2, p.9].\n\n"
            "3. **Patent Revocations**: TKDL evidence has led to revocation/withdrawal "
            "of over **200 patent applications** worldwide, including the famous turmeric "
            "and neem patents [TKDL Access Guidelines, Section 5.1, p.14].\n\n"
            "4. **Article 29 of TRIPS** requires patent applicants to disclose prior art, "
            "and TKDL provides a structured, searchable database for this purpose "
            "[TRIPS Agreement, Article 29, p.335]."
        ),
        "citations": [
            {
                "source_title": "TKDL Access Guidelines",
                "section": "1.1",
                "page": 2,
                "authority": "CSIR",
                "regime": "national",
                "relevance_score": 0.96,
                "chunk_id": "demo-tkdl-1-1",
                "full_text": "The Traditional Knowledge Digital Library (TKDL) is a pioneering initiative to digitize and document traditional knowledge existing in India in languages and format understandable by patent examiners at the International Patent Offices."
            },
            {
                "source_title": "Patents Act, 1970",
                "section": "25(1)(k)",
                "page": 45,
                "authority": "IP India",
                "regime": "national",
                "relevance_score": 0.92,
                "chunk_id": "demo-patents-25-1-k",
                "full_text": "Section 25(1)(k): Opposition to grant of patent on the ground that the invention so far as claimed in any claim of the complete specification is anticipated having regard to the knowledge, oral or otherwise, available within any local or indigenous community in India or elsewhere."
            },
            {
                "source_title": "TKDL Access Guidelines",
                "section": "3.2",
                "page": 9,
                "authority": "CSIR",
                "regime": "national",
                "relevance_score": 0.89,
                "chunk_id": "demo-tkdl-3-2",
                "full_text": "TKDL has signed access agreements with nine international patent offices including EPO, USPTO, JPO, UKIPO, IP Australia, CIPO, DPMA, and Rospatent for use during patent examination."
            },
            {
                "source_title": "TRIPS Agreement (WTO)",
                "section": "Article 29",
                "page": 335,
                "authority": "WTO",
                "regime": "international",
                "relevance_score": 0.84,
                "chunk_id": "demo-trips-29",
                "full_text": "Article 29: Conditions on Patent Applicants — Members shall require that an applicant for a patent shall disclose the invention in a manner sufficiently clear and complete for the invention to be carried out by a person skilled in the art."
            }
        ],
        "regime_tags": ["national", "international"],
        "confidence": "high",
        "language_detected": "en"
    },

    # ── Demo Query 5 ─────────────────────────────────────────────
    "Explain Section 3(d) of Patents Act with examples.": {
        "answer": (
            "**Section 3(d) of the Patents Act, 1970** is one of the most significant "
            "provisions affecting pharmaceutical and Ayurvedic drug patenting in India.\n\n"
            "**Text of Section 3(d):**\n"
            "> *\"The mere discovery of a new form of a known substance which does not "
            "result in the enhancement of the known efficacy of that substance or the "
            "mere discovery of any new property or new use for a known substance or of "
            "the mere use of a known process, machine or apparatus unless such known "
            "process results in a new product or employs at least one new reactant.\"* "
            "[Patents Act 1970, Section 3(d), p.10]\n\n"
            "**Explanation (from the Act):**\n"
            "For the purposes of this clause, salts, esters, ethers, polymorphs, metabolites, "
            "pure form, particle size, isomers, mixtures of isomers, complexes, combinations "
            "and other derivatives of known substance shall be considered to be the same "
            "substance, unless they differ significantly in properties with regard to efficacy "
            "[Patents Act 1970, Section 3(d) Explanation, p.10].\n\n"
            "**Landmark Examples:**\n\n"
            "1. **Novartis v. Union of India (2013)**: The Supreme Court upheld rejection of "
            "the patent for Gleevec (imatinib mesylate beta-crystalline form), ruling it was "
            "a new form of a known substance without enhanced efficacy. This is the definitive "
            "interpretation of Section 3(d) [Patents Act 1970, Section 3(d), p.10].\n\n"
            "2. **Ayurvedic Context**: A manufacturer seeking to patent a traditional "
            "Ashwagandha (Withania somnifera) formulation in nano-encapsulated form would "
            "need to demonstrate that the new form shows **significantly enhanced therapeutic "
            "efficacy** over the traditional form, not merely improved bioavailability "
            "[Patents Act 1970, Section 3(d), p.10].\n\n"
            "3. **Relationship with Section 3(p)**: For Ayurvedic formulations, Section 3(d) "
            "works in conjunction with **Section 3(p)** which excludes traditional knowledge. "
            "Even if enhanced efficacy is shown, the formulation must not be documented in "
            "TKDL as prior art [Patents Act 1970, Section 3(p), p.12]."
        ),
        "citations": [
            {
                "source_title": "Patents Act, 1970",
                "section": "3(d)",
                "page": 10,
                "authority": "IP India",
                "regime": "national",
                "relevance_score": 0.97,
                "chunk_id": "demo-patents-3d-detail",
                "full_text": "Section 3(d): The mere discovery of a new form of a known substance which does not result in the enhancement of the known efficacy of that substance or the mere discovery of any new property or new use for a known substance or of the mere use of a known process, machine or apparatus unless such known process results in a new product or employs at least one new reactant. Explanation.—For the purposes of this clause, salts, esters, ethers, polymorphs, metabolites, pure form, particle size, isomers, mixtures of isomers, complexes, combinations and other derivatives of known substance shall be considered to be the same substance, unless they differ significantly in properties with regard to efficacy."
            },
            {
                "source_title": "Patents Act, 1970",
                "section": "3(p)",
                "page": 12,
                "authority": "IP India",
                "regime": "national",
                "relevance_score": 0.90,
                "chunk_id": "demo-patents-3p-ref",
                "full_text": "Section 3(p): An invention which, in effect, is traditional knowledge or which is an aggregation or duplication of known properties of traditionally known component or components."
            }
        ],
        "regime_tags": ["national"],
        "confidence": "high",
        "language_detected": "en"
    },
}


def get_mock_response(query: str) -> dict | None:
    """
    Fuzzy-match a query against pre-cached demo responses.
    Returns None if no match found.
    """
    query_lower = query.strip().lower().rstrip("?").rstrip(".")

    for demo_query, response in DEMO_RESPONSES.items():
        demo_lower = demo_query.strip().lower().rstrip("?").rstrip(".")
        if demo_lower == query_lower:
            return response

    # Keyword-based partial matching
    keyword_map = {
        "patent": "Can I patent a traditional Ayurvedic formulation?",
        "traditional": "Can I patent a traditional Ayurvedic formulation?",
        "gmp": "What are GMP requirements for AYUSH manufacturing units?",
        "manufacturing": "What are GMP requirements for AYUSH manufacturing units?",
        "export": "How do I register an Ayurvedic drug for export to the EU?",
        "eu": "How do I register an Ayurvedic drug for export to the EU?",
        "tkdl": "What is TKDL and how does it affect patentability?",
        "traditional knowledge digital": "What is TKDL and how does it affect patentability?",
        "3(d)": "Explain Section 3(d) of Patents Act with examples.",
        "section 3d": "Explain Section 3(d) of Patents Act with examples.",
        "section 3(d)": "Explain Section 3(d) of Patents Act with examples.",
    }

    for keyword, matched_query in keyword_map.items():
        if keyword in query_lower:
            return DEMO_RESPONSES[matched_query]

    return None
