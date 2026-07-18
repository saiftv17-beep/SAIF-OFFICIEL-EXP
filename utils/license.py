import secrets


def generate_license():

    part1 = secrets.token_hex(2).upper()
    part2 = secrets.token_hex(2).upper()
    part3 = secrets.token_hex(2).upper()
    part4 = secrets.token_hex(2).upper()

    return f"BRNO-{part1}-{part2}-{part3}-{part4}"