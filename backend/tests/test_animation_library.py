from app.services.animation.library import AnimationLibrary


def test_hand_authored_pose_is_used():
    lib = AnimationLibrary()
    pose = lib.get_animation("hello")
    assert pose.right_hand == [0.25, 0.55, 0.35]


def test_unknown_sign_gets_procedural_pose_not_a_crash():
    lib = AnimationLibrary()
    pose = lib.get_animation("some_totally_unlisted_sign_xyz")
    assert pose.right_hand is not None
    assert len(pose.right_hand) == 3


def test_procedural_pose_is_deterministic_across_instances():
    pose1 = AnimationLibrary().get_animation("zzz_unlisted")
    pose2 = AnimationLibrary().get_animation("zzz_unlisted")
    assert pose1.right_hand == pose2.right_hand
    assert pose1.left_hand == pose2.left_hand


def test_all_26_letters_have_poses():
    lib = AnimationLibrary()
    for letter in "ABCDEFGHIJKLMNOPQRSTUVWXYZ":
        pose = lib.get_animation(AnimationLibrary.letter_animation_id(letter))
        assert pose.right_hand is not None


def test_resolve_lowercases_sign_id():
    lib = AnimationLibrary()
    assert lib.resolve("HELLO") == "hello"


def test_get_all_includes_vocabulary_entries():
    lib = AnimationLibrary()
    everything = lib.get_all()
    assert "hello" in everything
    assert "idle" in everything
    assert "letter_a" in everything
