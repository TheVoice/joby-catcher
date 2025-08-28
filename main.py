def robotInit():
    global S_armsClosed
    huskylens.init_i2c()
    huskylens.init_mode(protocolAlgorithm.ALGORITHM_OBJECT_TRACKING)
    huskylens.clear_osd()
    A_close()
    S_armsClosed = 1
def readLoop():
    global S_ballOnScreen
    huskylens.request()
    if huskylens.is_learned(1):
        huskylens.write_osd(convert_to_text(huskylens.reade_box(1, Content1.X_CENTER)),
            20,
            20)
        huskylens.write_osd(convert_to_text(huskylens.reade_box(1, Content1.Y_CENTER)),
            20,
            50)
        if huskylens.is_appear(1, HUSKYLENSResultType_t.HUSKYLENS_RESULT_BLOCK):
            S_ballOnScreen = 1
        else:
            S_ballOnScreen = 0
def A_close():
    global S_armsClosed
    servos.P2.set_angle(90)
    pins.servo_write_pin(AnalogPin.P8, 15)
    S_armsClosed = 1
def A_open():
    global S_armsClosed
    servos.P2.set_angle(15)
    pins.servo_write_pin(AnalogPin.P8, 90)
    S_armsClosed = 0
def A_leftTurnStep():
    servos.P0.run(50)
    servos.P1.run(50)
    basic.pause(100)
    servos.P0.stop()
    servos.P1.stop()
def A_rightTurnStep():
    servos.P0.run(-50)
    servos.P1.run(50)
    basic.pause(10)
    servos.P0.stop()
    servos.P1.stop()
def A_goForwardStep():
    servos.P0.run(100)
    servos.P1.run(100)
    basic.pause(100)
    servos.P0.stop()
    servos.P1.stop()

def logicLoop():
    if S_ballOnScreen:
        basic.show_leds("""
            . . # . .
            . # # . .
            # # # . .
            . . # . .
            . . # . .
            """)
        A_open()
        A_leftTurnStep()
    else:
        basic.show_leds("""
            . . # . .
            . # . # .
            . # . # .
            . # . # .
            . . # . .
            """)
        A_close()
S_ballOnScreen = 0
S_armsClosed = 0
basic.show_string("ON3")
basic.show_leds("""
    . . # # .
    # . . # .
    # # # # #
    # . . # .
    . . # # .
    """)
robotInit()

def on_forever():
    readLoop()
    logicLoop()
basic.forever(on_forever)
