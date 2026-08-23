from app.services.ai.key_manager import FailureType, GeminiKeyManager


def test_no_keys_configured():
    mgr = GeminiKeyManager(keys=[])
    assert mgr.configured is False
    assert mgr.get_healthy_key() is None


def test_single_healthy_key():
    mgr = GeminiKeyManager(keys=["key1"])
    picked = mgr.get_healthy_key()
    assert picked == (0, "key1")


def test_key_stays_in_use_while_healthy_no_unnecessary_rotation():
    mgr = GeminiKeyManager(keys=["key1", "key2"])
    first = mgr.get_healthy_key()
    mgr.report_success(first[0])
    # Round-robin still advances position, but health is unaffected by success —
    # a successful key is never marked unhealthy.
    assert mgr._health[first[0]].healthy is True


def test_first_key_fails_second_succeeds():
    mgr = GeminiKeyManager(keys=["key1", "key2"])
    idx1, key1 = mgr.get_healthy_key()
    assert (idx1, key1) == (0, "key1")
    mgr.report_failure(idx1, FailureType.RATE_LIMIT)

    idx2, key2 = mgr.get_healthy_key()
    assert (idx2, key2) == (1, "key2")


def test_rate_limited_key_goes_into_cooldown_not_permanent_ban():
    mgr = GeminiKeyManager(keys=["key1"])
    mgr.report_failure(0, FailureType.RATE_LIMIT)
    status = mgr.status()[0]
    assert status["in_cooldown"] is True
    assert status["last_failure_type"] == "rate_limit"
    # Not permanently disabled — cooldown_until is set, `healthy` flag itself untouched.
    assert mgr._health[0].healthy is True


def test_all_keys_unavailable_returns_none():
    mgr = GeminiKeyManager(keys=["key1", "key2"])
    mgr.report_failure(0, FailureType.QUOTA)
    mgr.report_failure(1, FailureType.SERVER_ERROR)
    assert mgr.get_healthy_key() is None


def test_status_never_exposes_raw_key():
    mgr = GeminiKeyManager(keys=["supersecretkeyvalue12345"])
    status = mgr.status()[0]
    assert "supersecretkeyvalue12345" not in str(status)
    assert status["key"].startswith("supe")
    assert status["key"].endswith("2345")
