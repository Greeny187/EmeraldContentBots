/**
 * TON Connect Integration für DAO Treasury & Voting Power
 * Verbindet die DAO mit der TON Blockchain für echte Transaktionen
 */

import TonConnect from '@tonconnect/ui';

// TON Connect Konfiguration
const manifestUrl = 'https://emerald-dao.example.com/tonconnect-manifest.json';

class DAOTonConnector {
    constructor() {
        this.tonConnect = new TonConnect({
            manifestUrl,
            buttons: [
                'Tonkeeper',
                'Ledger',
                'XRayWallet',
                'MyTonWallet',
            ]
        });
        
        this.jettonMaster = process.env.REACT_APP_EMRD_JETTON_MASTER || '';
        this.daoAddress = process.env.REACT_APP_DAO_CONTRACT || '';
        this.treasuryAddress = process.env.REACT_APP_DAO_TREASURY || '';
    }

    /**
     * Verbinde Wallet mit TON Connect
     */
    async connectWallet() {
        try {
            if (this.tonConnect.wallet) {
                return this.tonConnect.wallet;
            }

            const connectedWallet = await this.tonConnect.connectWallet();
            console.log('✅ Wallet connected:', connectedWallet);
            return connectedWallet;
        } catch (error) {
            console.error('Wallet connection error:', error);
            throw error;
        }
    }

    /**
     * Trenne Wallet
     */
    async disconnectWallet() {
        try {
            await this.tonConnect.disconnect();
            console.log('✅ Wallet disconnected');
        } catch (error) {
            console.error('Disconnect error:', error);
        }
    }

    /**
     * Hole EMRD Balance des Users
     */
    async getEMRDBalance(address) {
        try {
            // Query Jetton wallet balance
            const response = await fetch(
                `https://tonapi.io/v2/accounts/${address}/jettons`,
                { headers: { 'Authorization': `Bearer ${process.env.TONAPI_KEY}` } }
            );
            
            if (!response.ok) return 0;

            const data = await response.json();
            const emrdToken = data.jettons.find(j => j.balance);
            
            return emrdToken ? parseFloat(emrdToken.balance) / 1e9 : 0;
        } catch (error) {
            console.error('EMRD balance fetch error:', error);
            return 0;
        }
    }

    /**
     * Sende EMRD Transfer für Treasury Deposit
     */
    async sendTreasuryDeposit(amount, walletAddress) {
        try {
            if (!this.tonConnect.wallet) {
                throw new Error('Wallet not connected');
            }

            // Create transfer transaction
            const transfer = {
                validUntil: Math.floor(Date.now() / 1000) + 600,
                messages: [
                    {
                        address: this.treasuryAddress,
                        amount: (amount * 1e9).toString(),
                        payload: this._createTransferPayload('DEPOSIT')
                    }
                ]
            };

            const result = await this.tonConnect.sendTransaction(transfer);
            console.log('✅ Transaction sent:', result);
            return result;
        } catch (error) {
            console.error('Treasury deposit error:', error);
            throw error;
        }
    }

    /**
     * Approve EMRD für DAO Contract
     */
    async approveEMRDForDAO(amount) {
        try {
            if (!this.tonConnect.wallet) {
                throw new Error('Wallet not connected');
            }

            const transaction = {
                validUntil: Math.floor(Date.now() / 1000) + 600,
                messages: [
                    {
                        address: this.jettonMaster,
                        amount: '100000000',
                        payload: this._createApprovePayload(this.daoAddress, amount)
                    }
                ]
            };

            const result = await this.tonConnect.sendTransaction(transaction);
            console.log('✅ Approval transaction sent:', result);
            return result;
        } catch (error) {
            console.error('Approval error:', error);
            throw error;
        }
    }

    /**
     * Erstelle Transfer Payload für Jettons
     */
    _createTransferPayload(type) {
        // Jetton transfer operation code 0xf8a7ea5
        const opcode = '0xf8a7ea5';
        // Diese würde in einer echten Implementierung mit TonWeb Cell erstellt werden
        return Buffer.from([0xf8, 0xa7, 0xea, 0x5]).toString('hex');
    }

    /**
     * Erstelle Approve Payload
     */
    _createApprovePayload(spender, amount) {
        // Jetton approve operation
        const opcode = '0x095ea7b3';
        // Real implementation would use TonWeb Cell
        return Buffer.from([0x09, 0x5e, 0xa7, 0xb3]).toString('hex');
    }

    /**
     * Hole Transaction History
     */
    async getTransactionHistory(address, limit = 20) {
        try {
            const response = await fetch(
                `https://tonapi.io/v2/accounts/${address}/transactions?limit=${limit}`,
                { headers: { 'Authorization': `Bearer ${process.env.TONAPI_KEY}` } }
            );

            if (!response.ok) return [];

            const data = await response.json();
            return data.transactions || [];
        } catch (error) {
            console.error('Transaction history error:', error);
            return [];
        }
    }

    /**
     * Verifiziere Transaction
     */
    async verifyTransaction(txHash) {
        try {
            const response = await fetch(
                `https://tonapi.io/v2/blockchain/transactions/${txHash}`,
                { headers: { 'Authorization': `Bearer ${process.env.TONAPI_KEY}` } }
            );

            if (!response.ok) return null;

            return await response.json();
        } catch (error) {
            console.error('Transaction verification error:', error);
            return null;
        }
    }

    /**
     * Hole Wallet Info
     */
    async getWalletInfo(address) {
        try {
            const response = await fetch(
                `https://tonapi.io/v2/accounts/${address}`,
                { headers: { 'Authorization': `Bearer ${process.env.TONAPI_KEY}` } }
            );

            if (!response.ok) return null;

            const data = await response.json();
            return {
                address: data.address,
                balance: data.balance / 1e9, // in TON
                status: data.status,
                lastActivity: data.last_activity,
            };
        } catch (error) {
            console.error('Wallet info error:', error);
            return null;
        }
    }

    /**
     * Überprüfe ob Wallet verbunden ist
     */
    isConnected() {
        return !!this.tonConnect.wallet;
    }

    /**
     * Hole verbundene Wallet Adresse
     */
    getWalletAddress() {
        return this.tonConnect.wallet?.account?.address || null;
    }
}

export default DAOTonConnector;
