from app.services.language.detector import LanguageDetector


def test_detects_english():
    result = LanguageDetector().detect("Hello everyone, today we are learning about AI.")
    assert result.language == "en"
    assert result.confidence > 0.5


def test_detects_hindi():
    result = LanguageDetector().detect("आज हम आर्टिफिशियल इंटेलिजेंस के बारे में सीखेंगे")
    assert result.language == "hi"
    assert result.confidence > 0.5


def test_empty_string():
    result = LanguageDetector().detect("")
    assert result.confidence == 0.0
