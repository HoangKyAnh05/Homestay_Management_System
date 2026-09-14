import paramiko

host = "14.225.253.234"
user = "root"
password = "tx1Vh8IvuLebXeWsQvus"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(host, username=user, password=password, timeout=10)

def run_cmd(cmd):
    print(f"=== {cmd} ===")
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode('utf-8', errors='ignore')
    if out:
        print(out)

# Update customer.an@example.com password to BCrypt hash of 123456 (same as admin)
run_cmd('''docker exec homestay-mysql mysql -uroot -p123456 homestayManagement -e "
UPDATE accounts SET password = (SELECT p FROM (SELECT password as p FROM accounts WHERE id = 1) t) WHERE id IN (3, 6);
SELECT id, email, role_id, is_active FROM accounts WHERE id IN (1, 2, 3, 4, 5, 6);
"''')

ssh.close()
