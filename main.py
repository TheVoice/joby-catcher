def robotInit():
    global S_armsClosed
    global state
    huskylens.init_i2c()
    huskylens.init_mode(protocolAlgorithm.ALGORITHM_COLOR_RECOGNITION)
    huskylens.clear_osd()
    A_close()
    S_armsClosed = 1
    A_camMoveZ()
    state = "SEARCHING"
    
def readLoop():
    global S_ballOnScreen, S_weCanCatch, state
    huskylens.request()
    if huskylens.is_learned(1):
        huskylens.write_osd(convert_to_text(huskylens.reade_box(1, Content1.X_CENTER)),
            20,
            20)
        huskylens.write_osd(convert_to_text(huskylens.reade_box(1, Content1.Y_CENTER)),
            20,
            50)
        if huskylens.is_appear(1, HUSKYLENSResultType_t.HUSKYLENS_RESULT_BLOCK):
            state = "MOVING"
            music.play(music.tone_playable(Note.G, music.beat(BeatFraction.WHOLE)), music.PlaybackMode.UNTIL_DONE)
        else:
            state = "SEARCHING"
            music.play(music.tone_playable(Note.C, music.beat(BeatFraction.WHOLE)), music.PlaybackMode.UNTIL_DONE)
def A_turnRightStep():
    servos.P0.run(-50)
    servos.P1.run(50)
    basic.pause(10)
    servos.P0.stop()
    servos.P1.stop()
def A_turnLeftStep():
    servos.P0.run(50)
    servos.P1.run(-50)
    basic.pause(100)
    servos.P0.stop()
    servos.P1.stop()
def A_goForwardStep():
    servos.P0.run(100)
    servos.P1.run(100)
    basic.pause(100)
    servos.P0.stop()
    servos.P1.stop()
def R_search():
    A_turnLeftStep()
def A_camMoveZ():
    servos.P2.set_angle(90)
def A_close():
    global S_armsClosed
    # servos.P2.set_angle(90)
    # pins.servo_write_pin(AnalogPin.P8, 15)
    S_armsClosed = 1
def A_open():
    global S_armsClosed
    # servos.P2.set_angle(15)
    # pins.servo_write_pin(AnalogPin.P8, 90)
    S_armsClosed = 0

S_weCanCatch = 0
S_ballOnScreen = 0
S_armsClosed = 0
basic.show_string("ON3-2")
basic.show_leds("""
    . . # # .
    # . . # .
    # # # # #
    # . . # .
    . . # # .
    """)
state = ""
robotInit()

def stateLoop():
    if state == "WAITING":
        servos.P0.run(0)
        servos.P1.run(0)
    elif state == "MOVING":
        basic.show_leds("""
            . . # . .
            . # # . .
            # # # . .
            . . # . .
            . . # . .
            """)
        servos.P0.run(100)
        servos.P1.run(100)
    elif state == "SEARCHING":
        basic.show_leds("""
            . . # . .
            . # . # .
            . # . # .
            . # . # .
            . . # . .
            """)
        servos.P0.run(30)
        servos.P1.run(-30)
    elif state == "FETCHING":
        pass
    elif state == "CATCHING":
        pass
    elif state == "DROPPING":
        pass
    elif state == "STOPPED":
        pass
    elif state == "TO_SAFETY":
        pass
    elif state == "MISSION_COMPLETED":
        pass

def on_forever():
    readLoop()
    stateLoop()

basic.forever(on_forever)
