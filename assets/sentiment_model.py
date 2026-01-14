
import json
import re

# Lexicon for sentiment analysis
LEXICON = {
    # Positive
    'love': 3.2, 'loved': 3.2, 'loves': 3.2, 'awesome': 3.1, 'amazing': 3.2, 'excellent': 3.1,
    'perfect': 3.0, 'great': 3.0, 'best': 3.0, 'beautiful': 2.5, 'good': 1.9, 'happy': 2.5,
    'nice': 1.8, 'wonderful': 2.8, 'fantastic': 2.9, 'excited': 2.5, 'glad': 2.0,
    'enjoy': 2.2, 'enjoyed': 2.2, 'super': 2.5, 'highly': 1.5, 'recommend': 2.0,
    # Negative
    'hate': -3.0, 'hated': -3.0, 'awful': -3.0, 'terrible': -3.0, 'horrible': -3.0,
    'bad': -2.5, 'worst': -3.0, 'disappointing': -2.5, 'disappointed': -2.6,
    'poor': -2.0, 'waste': -2.5, 'useless': -2.5, 'broken': -2.0, 'broke': -2.0,
    'slow': -1.5, 'stupid': -2.0, 'sucks': -2.5, 'rude': -2.5, 'never': -1.5,
}

NEGATION_WORDS = {'not', 'no', 'never', 'nothing', 'neither', 'nor', 'barely', 'hardly', 'scarcely'}

sentiment_phrases = {
    'waste of money': -3.5,
    'customer service': 0.0,
    'highly recommend': 3.5,
    'works great': 3.0,
    'not bad': 1.5,
    'customer support': 0.0,
}

def detect_phrases(text, phrases_dict):
    found = []
    text_lower = text.lower()
    for phrase, score in phrases_dict.items():
        if phrase in text_lower:
            found.append((phrase, score))
    return found

def analyze_sentiment_enhanced(text, star_rating=None):
    words = re.findall(r'\b\w+\b', text.lower())
    pos_score = 0
    neg_score = 0
    
    i = 0
    while i < len(words):
        word = words[i]
        score = LEXICON.get(word, 0)
        
        is_negated = False
        if i > 0 and words[i-1] in NEGATION_WORDS:
            is_negated = True
        elif i > 1 and words[i-2] in NEGATION_WORDS:
            is_negated = True
            
        if score != 0:
            if is_negated:
                score = score * -0.5
            
            if score > 0:
                pos_score += score
            else:
                neg_score += abs(score)
        
        i += 1
        
    details = {
        'total_pos_score': pos_score,
        'total_neg_score': neg_score,
        'word_count': len(words)
    }
    
    if pos_score > neg_score:
        label = 'Positive'
    elif neg_score > pos_score:
        label = 'Negative'
    else:
        label = 'Neutral'
        
    return label, details

def analyze_sentiment_with_phrases(text, star_rating=None):
    """
    Final enhanced sentiment analysis with phrases and all improvements
    """
    basic_sentiment, basic_details = analyze_sentiment_enhanced(text, star_rating)
    found_phrases = detect_phrases(text, sentiment_phrases)
    
    phrase_pos_score = 0
    phrase_neg_score = 0
    positive_phrases = []
    negative_phrases = []
    
    for phrase, score in found_phrases:
        if score > 0:
            phrase_pos_score += score
            positive_phrases.append(phrase)
        elif score < 0:
            phrase_neg_score += abs(score)
            negative_phrases.append(phrase)
    
    # Phrases get extra weight
    total_pos_score = basic_details['total_pos_score'] + (phrase_pos_score * 1.5)
    total_neg_score = basic_details['total_neg_score'] + (phrase_neg_score * 1.5)
    sentiment_difference = total_pos_score - total_neg_score
    
    if sentiment_difference > 3:
        final_sentiment = 'Positive'
    elif sentiment_difference < -3:
        final_sentiment = 'Negative'
    else:
        if phrase_pos_score >= 3 and phrase_neg_score == 0:
            final_sentiment = 'Positive'
        elif phrase_neg_score >= 3 and phrase_pos_score == 0:
            final_sentiment = 'Negative'
        elif star_rating:
            if star_rating >= 4 and sentiment_difference >= 0:
                final_sentiment = 'Positive'
            elif star_rating <= 2 and sentiment_difference <= 0:
                final_sentiment = 'Negative'
            else:
                final_sentiment = 'Neutral'
        else:
            final_sentiment = 'Neutral'
    
    total_signal = total_pos_score + total_neg_score
    if total_signal == 0:
        confidence = 0
    else:
        raw_conf = abs(sentiment_difference) / (total_signal + 2)
        confidence = min(max(raw_conf * 100, 0), 100)
        
    if confidence > 60:
        conf_level = 'High'
    elif confidence > 30:
        conf_level = 'Medium'
    else:
        conf_level = 'Low'

    details = {
        **basic_details,
        'total_pos_score_with_phrases': total_pos_score,
        'total_neg_score_with_phrases': total_neg_score,
        'phrase_difference': sentiment_difference,
        'found_phrases': [p[0] for p in found_phrases],
        'positive_phrases': positive_phrases,
        'negative_phrases': negative_phrases,
        'phrase_pos_score': phrase_pos_score,
        'phrase_neg_score': phrase_neg_score,
        'final_sentiment': final_sentiment,
        'confidence_score': round(confidence, 1),
        'confidence_level': conf_level
    }
    
    return final_sentiment, details
