def stepForward():
    servos.P0.run(100)
    servos.P1.run(100)
    basic.pause(100)
    servos.P0.stop()
    servos.P1.stop()
def close():
    servos.P2.set_angle(90)
    pins.servo_write_pin(AnalogPin.P8, 15)
def open2():
    servos.P2.set_angle(15)
    pins.servo_write_pin(AnalogPin.P8, 90)
basic.show_string("Hello!")
basic.show_leds("""
    . # . # .
    . . . . .
    . . . . .
    # # . # #
    . # # # .
    """)
huskylens.init_i2c()
huskylens.init_mode(protocolAlgorithm.ALGORITHM_OBJECT_TRACKING)
huskylens.clear_osd()
close()
# states:
# WAITING
# MOVING
# SEARCHING
# FETCHING
# CATCHING
# DROPPING
# STOPPED
# TO_SAFETY
# MISSION_COMPLETED
state = "WAITING"

def on_forever():
    global state
    huskylens.request()
    if huskylens.is_learned(1):
        huskylens.write_osd(convert_to_text(huskylens.reade_box(1, Content1.X_CENTER)),
            20,
            20)
        huskylens.write_osd(convert_to_text(huskylens.reade_box(1, Content1.Y_CENTER)),
            20,
            50)
        if huskylens.is_appear(1, HUSKYLENSResultType_t.HUSKYLENS_RESULT_BLOCK):
            basic.show_leds("""
                . . # . .
                . # # . .
                # # # . .
                . . # . .
                . . # . .
                """)
            state = "FETCHING"
        else:
            basic.show_leds("""
                . . # . .
                . # . # .
                . # . # .
                . # . # .
                . . # . .
                """)
            state = "SEARCHING"
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
