#SRC: https://makecode.microbit.org/S17696-59967-75967-95467
basic.show_icon(IconNames.HEART)
huskylens.init_i2c()
huskylens.clear_osd()
huskylens.write_osd("AmaBot 2025", 150, 30)
huskylens.init_mode(protocolAlgorithm.ALGORITHM_OBJECT_TRACKING)
servos.P0.set_angle(90)

def on_forever():
    huskylens.request()
    if huskylens.isAppear_s(HUSKYLENSResultType_t.HUSKYLENS_RESULT_BLOCK):
        basic.show_icon(IconNames.YES)
        servos.P0.set_angle(0)
        music.play(music.tone_playable(262, music.beat(BeatFraction.WHOLE)),
            music.PlaybackMode.LOOPING_IN_BACKGROUND)
    else:
        basic.show_icon(IconNames.NO)
        servos.P0.set_angle(180)
        music.stop_all_sounds()
    basic.pause(200)
basic.forever(on_forever)

