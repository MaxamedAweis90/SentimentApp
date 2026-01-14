import { NextRequest, NextResponse } from "next/server";

// Lexicon for sentiment analysis
const LEXICON: Record<string, number> = {
  // Positive
  love: 3.2,
  loved: 3.2,
  loves: 3.2,
  awesome: 3.1,
  amazing: 3.2,
  excellent: 3.1,
  perfect: 3.0,
  great: 3.0,
  best: 3.0,
  beautiful: 2.5,
  good: 1.9,
  happy: 2.5,
  nice: 1.8,
  wonderful: 2.8,
  fantastic: 2.9,
  excited: 2.5,
  glad: 2.0,
  enjoy: 2.2,
  enjoyed: 2.2,
  super: 2.5,
  highly: 1.5,
  recommend: 2.0,
  // Negative
  hate: -3.0,
  hated: -3.0,
  awful: -3.0,
  terrible: -3.0,
  horrible: -3.0,
  bad: -2.5,
  worst: -3.0,
  disappointing: -2.5,
  disappointed: -2.6,
  poor: -2.0,
  waste: -2.5,
  useless: -2.5,
  broken: -2.0,
  broke: -2.0,
  slow: -1.5,
  stupid: -2.0,
  sucks: -2.5,
  rude: -2.5,
  never: -1.5,
};

const NEGATION_WORDS = new Set([
  "not",
  "no",
  "never",
  "nothing",
  "neither",
  "nor",
  "barely",
  "hardly",
  "scarcely",
]);

const SENTIMENT_PHRASES: Record<string, number> = {
  "waste of money": -3.5,
  "customer service": 0.0,
  "highly recommend": 3.5,
  "works great": 3.0,
  "not bad": 1.5,
  "customer support": 0.0,
};

function detectPhrases(text: string): [string, number][] {
  const found: [string, number][] = [];
  const textLower = text.toLowerCase();
  for (const [phrase, score] of Object.entries(SENTIMENT_PHRASES)) {
    if (textLower.includes(phrase)) {
      found.push([phrase, score]);
    }
  }
  return found;
}

function analyzeBasic(text: string) {
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  let posScore = 0;
  let negScore = 0;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    let score = LEXICON[word] || 0;

    const isNegated =
      (i > 0 && NEGATION_WORDS.has(words[i - 1])) ||
      (i > 1 && NEGATION_WORDS.has(words[i - 2]));

    if (score !== 0) {
      if (isNegated) {
        score = score * -0.5;
      }
      if (score > 0) {
        posScore += score;
      } else {
        negScore += Math.abs(score);
      }
    }
  }

  return { posScore, negScore, wordCount: words.length };
}

function analyzeSentiment(text: string, starRating?: number) {
  const basic = analyzeBasic(text);
  const foundPhrases = detectPhrases(text);

  let phrasePos = 0;
  let phraseNeg = 0;
  const positivePhrases: string[] = [];
  const negativePhrases: string[] = [];

  for (const [phrase, score] of foundPhrases) {
    if (score > 0) {
      phrasePos += score;
      positivePhrases.push(phrase);
    } else if (score < 0) {
      phraseNeg += Math.abs(score);
      negativePhrases.push(phrase);
    }
  }

  const totalPos = basic.posScore + phrasePos * 1.5;
  const totalNeg = basic.negScore + phraseNeg * 1.5;
  const difference = totalPos - totalNeg;

  let sentiment: string;
  if (difference > 3) {
    sentiment = "Positive";
  } else if (difference < -3) {
    sentiment = "Negative";
  } else {
    if (phrasePos >= 3 && phraseNeg === 0) {
      sentiment = "Positive";
    } else if (phraseNeg >= 3 && phrasePos === 0) {
      sentiment = "Negative";
    } else if (starRating) {
      if (starRating >= 4 && difference >= 0) {
        sentiment = "Positive";
      } else if (starRating <= 2 && difference <= 0) {
        sentiment = "Negative";
      } else {
        sentiment = "Neutral";
      }
    } else {
      sentiment = "Neutral";
    }
  }

  const totalSignal = totalPos + totalNeg;
  const confidence =
    totalSignal === 0
      ? 0
      : Math.min(
          Math.max((Math.abs(difference) / (totalSignal + 2)) * 100, 0),
          100
        );
  const confLevel =
    confidence > 60 ? "High" : confidence > 30 ? "Medium" : "Low";

  return {
    sentiment,
    details: {
      total_pos_score: basic.posScore,
      total_neg_score: basic.negScore,
      word_count: basic.wordCount,
      total_pos_score_with_phrases: totalPos,
      total_neg_score_with_phrases: totalNeg,
      phrase_difference: difference,
      found_phrases: foundPhrases.map(([p]) => p),
      positive_phrases: positivePhrases,
      negative_phrases: negativePhrases,
      phrase_pos_score: phrasePos,
      phrase_neg_score: phraseNeg,
      final_sentiment: sentiment,
      confidence_score: Math.round(confidence * 10) / 10,
      confidence_level: confLevel,
    },
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, star_rating } = body;

    if (!text || text.length < 10) {
      return NextResponse.json(
        {
          success: false,
          error: "Review text must be at least 10 characters long.",
        },
        { status: 400 }
      );
    }

    if (text.length > 1000) {
      return NextResponse.json(
        { success: false, error: "Review text cannot exceed 1000 characters." },
        { status: 400 }
      );
    }

    const result = analyzeSentiment(text, star_rating);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
