def robotInit():
    global S_armsClosed
    huskylens.init_i2c()
    huskylens.init_mode(protocolAlgorithm.ALGORITHM_COLOR_RECOGNITION)
    huskylens.clear_osd()
    A_close()
    S_armsClosed = 1
    A_camMoveZ()
    
def readLoop():
    global S_ballOnScreen, S_weCanCatch
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
            if S_ballOnScreen:
                S_weCanCatch = 1
            S_ballOnScreen = 0
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
def logicLoop():
    global S_weCanCatch
    if S_ballOnScreen:
        basic.show_leds("""
            . . # . .
            . # # . .
            # # # . .
            . . # . .
            . . # . .
            """)
        A_open()
        # A_goForwardStep()
        state = "MOVING"
    else:
        if S_weCanCatch:
            S_weCanCatch = 0
            A_goForwardStep()
            A_goForwardStep()
            A_goForwardStep()
            A_close()
        else:
            R_search()
        basic.show_leds("""
            . . # . .
            . # . # .
            . # . # .
            . # . # .
            . . # . .
            """)
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
robotInit()
state = "SEARCHING"

def on_forever():
    readLoop()
    logicLoop()

basic.forever(on_forever)
def on_forever2():
    if state == "WAITING":
        servos.P0.run(0)
        servos.P1.run(0)
    elif state == "MOVING":
        servos.P0.run(100)
        servos.P1.run(100)
    elif state == "SEARCHING":
        servos.P0.run(-50)
        servos.P1.run(50)
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
basic.forever(on_forever2)
