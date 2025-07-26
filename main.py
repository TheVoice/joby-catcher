def open2():
    servos.P2.set_angle(15)
    pins.servo_write_pin(AnalogPin.P8, 90)
def leftTurnStep():
    servos.P0.run(100)
    servos.P1.run(100)
    basic.pause(100)
    servos.P0.stop()
    servos.P1.stop()
def close():
    servos.P2.set_angle(90)
    pins.servo_write_pin(AnalogPin.P8, 15)
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

def on_forever():
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
            open2()
            leftTurnStep()
        else:
            basic.show_leds("""
                . . # . .
                . # . # .
                . # . # .
                . # . # .
                . . # . .
                """)
            close()
basic.forever(on_forever)
