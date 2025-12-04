const fs = require('fs');
const path = require('path');
const https = require('https');

// Função para buscar versão mais recente do npm
function getLatestVersion(packageName) {
    return new Promise((resolve, reject) => {
        const url = `https://registry.npmjs.org/${packageName}`;

        https.get(url, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const packageInfo = JSON.parse(data);
                    if (packageInfo['dist-tags'] && packageInfo['dist-tags'].latest) {
                        resolve(packageInfo['dist-tags'].latest);
                    } else {
                        resolve(null);
                    }
                } catch (error) {
                    reject(error);
                }
            });
        }).on('error', (error) => {
            reject(error);
        });
    });
}

// Função para comparar versões
function compareVersions(current, latest) {
    if (!current || !latest) return null;

    // Remove prefixos como ^, ~, etc.
    const cleanCurrent = current.replace(/^[\^~>=<]/, '');

    if (cleanCurrent === latest) return 'same';
    if (cleanCurrent === 'latest') return 'latest';

    // Comparação simples de strings (pode ser melhorada com semver)
    const currentParts = cleanCurrent.split('.').map(Number);
    const latestParts = latest.split('.').map(Number);

    for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
        const currentPart = currentParts[i] || 0;
        const latestPart = latestParts[i] || 0;

        if (latestPart > currentPart) return 'outdated';
        if (latestPart < currentPart) return 'newer';
    }

    return 'same';
}

// Função para extrair dependências de um package.json
function extractDependencies(packageJsonPath) {
    const content = fs.readFileSync(packageJsonPath, 'utf8');
    const pkg = JSON.parse(content);

    const deps = {
        dependencies: pkg.dependencies || {},
        devDependencies: pkg.devDependencies || {},
        peerDependencies: pkg.peerDependencies || {}
    };

    return deps;
}

// Função principal
async function checkAllDependencies() {
    const rootDir = path.join(__dirname, '..');
    const packageJsonFiles = [
        path.join(rootDir, 'package.json'),
        ...fs.readdirSync(path.join(rootDir, 'packages'))
            .filter(dir => {
                const dirPath = path.join(rootDir, 'packages', dir);
                return fs.statSync(dirPath).isDirectory();
            })
            .map(dir => path.join(rootDir, 'packages', dir, 'package.json'))
            .filter(file => fs.existsSync(file))
    ];

    const allDeps = new Map();

    // Coletar todas as dependências
    for (const pkgFile of packageJsonFiles) {
        try {
            const deps = extractDependencies(pkgFile);
            const pkgName = path.basename(path.dirname(pkgFile));

            for (const [depType, depList] of Object.entries(deps)) {
                for (const [depName, depVersion] of Object.entries(depList)) {
                    // Ignorar pacotes internos @cmmv/*
                    if (depName.startsWith('@cmmv/')) continue;

                    const key = `${depName}::${depType}`;
                    if (!allDeps.has(key)) {
                        allDeps.set(key, {
                            name: depName,
                            type: depType,
                            current: depVersion,
                            packages: []
                        });
                    }
                    allDeps.get(key).packages.push(pkgName);
                }
            }
        } catch (error) {
            console.error(`Erro ao processar ${pkgFile}:`, error.message);
        }
    }

    console.log(`\n🔍 Verificando ${allDeps.size} dependências únicas...\n`);

    const results = {
        outdated: [],
        same: [],
        errors: []
    };

    let processed = 0;
    const total = allDeps.size;

    // Verificar cada dependência
    for (const [key, dep] of allDeps) {
        processed++;
        process.stdout.write(`\r⏳ Processando ${processed}/${total}: ${dep.name}...`);

        try {
            // Adicionar delay para não sobrecarregar o npm registry
            await new Promise(resolve => setTimeout(resolve, 100));

            const latest = await getLatestVersion(dep.name);
            const comparison = compareVersions(dep.current, latest);

            if (comparison === 'outdated') {
                results.outdated.push({
                    ...dep,
                    latest
                });
            } else if (comparison === 'same') {
                results.same.push(dep);
            } else if (comparison === 'latest') {
                results.same.push(dep);
            }
        } catch (error) {
            results.errors.push({
                ...dep,
                error: error.message
            });
        }
    }

    console.log('\n\n' + '='.repeat(80));
    console.log('📊 RESULTADO DA ANÁLISE DE DEPENDÊNCIAS');
    console.log('='.repeat(80));

    if (results.outdated.length > 0) {
        console.log(`\n⚠️  DEPENDÊNCIAS DESATUALIZADAS (${results.outdated.length}):\n`);
        results.outdated
            .sort((a, b) => a.name.localeCompare(b.name))
            .forEach(dep => {
                console.log(`  📦 ${dep.name}`);
                console.log(`     Tipo: ${dep.type}`);
                console.log(`     Atual: ${dep.current}`);
                console.log(`     Mais recente: ${dep.latest}`);
                console.log(`     Usado em: ${dep.packages.join(', ')}`);
                console.log('');
            });
    }

    if (results.same.length > 0) {
        console.log(`\n✅ DEPENDÊNCIAS ATUALIZADAS (${results.same.length}):\n`);
        // Mostrar apenas as primeiras 10 para não poluir o output
        const toShow = results.same.slice(0, 10);
        toShow.forEach(dep => {
            console.log(`  ✓ ${dep.name} (${dep.current})`);
        });
        if (results.same.length > 10) {
            console.log(`  ... e mais ${results.same.length - 10} dependências atualizadas`);
        }
    }

    if (results.errors.length > 0) {
        console.log(`\n❌ ERROS AO VERIFICAR (${results.errors.length}):\n`);
        results.errors.forEach(dep => {
            console.log(`  ✗ ${dep.name}: ${dep.error}`);
        });
    }

    console.log('\n' + '='.repeat(80));
    console.log(`\n📝 Resumo:`);
    console.log(`   Total de dependências: ${total}`);
    console.log(`   Desatualizadas: ${results.outdated.length}`);
    console.log(`   Atualizadas: ${results.same.length}`);
    console.log(`   Erros: ${results.errors.length}`);
    console.log('='.repeat(80) + '\n');

    // Salvar resultado em arquivo JSON
    const outputFile = path.join(rootDir, 'scripts', 'dependency-check-results.json');
    fs.writeFileSync(outputFile, JSON.stringify({
        timestamp: new Date().toISOString(),
        summary: {
            total,
            outdated: results.outdated.length,
            upToDate: results.same.length,
            errors: results.errors.length
        },
        outdated: results.outdated,
        errors: results.errors
    }, null, 2));

    console.log(`💾 Resultado detalhado salvo em: ${outputFile}\n`);
}

// Executar
checkAllDependencies().catch(console.error);

