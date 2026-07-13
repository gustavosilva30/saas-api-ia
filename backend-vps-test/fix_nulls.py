with open('main.py', 'rb') as f: data = f.read(); clean = data.replace(b'\x00', b''); f = open('main.py', 'wb'); f.write(clean); f.close()
